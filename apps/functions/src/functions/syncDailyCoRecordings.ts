import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onCall } from 'firebase-functions/v2/https'
import { info, error, warn } from 'firebase-functions/logger'
import { db, defaultHttpOptions } from '../util/context'
import fetch from 'node-fetch'
import { google } from 'googleapis'

interface DailyCoRecording {
  id: string
  room_name: string
  start_ts: number
  duration: number
}

interface DailyCoRecordingsResponse {
  total_count: number
  data: DailyCoRecording[]
}

interface DailyCoRecordingLink {
  download_link: string
}

interface GoogleFhirConfig {
  _tag: string
  projectId: string
  region: string
  dataset: string
  storeId: string
}

interface OrgConfig {
  slug: string
  frontendConfig?: {
    videoCallClient?: {
      _tag: string
      dailyCoProxyUrl?: string
      recordingsBucket?: {
        bucket_name: string
        bucket_region: string
        assume_role_arn: string
        allow_api_access: boolean
      }
    }
    mediaRepository?: GoogleFhirConfig
    encounterRepository?: GoogleFhirConfig
  }
}

interface OrgSecrets {
  apiKey?: string
}

interface MediaResource {
  resourceType: 'Media'
  id?: string
  status: 'completed'
  identifier?: Array<{ value: string }>
  createdDateTime?: string
  duration?: number
  content?: { url: string }
  encounter?: { reference: string }
}

interface EncounterResource {
  id: string
  resourceType: 'Encounter'
  location?: Array<{
    location?: {
      identifier?: {
        value: string
      }
    }
  }>
}

interface FhirBundle {
  resourceType: 'Bundle'
  type: string
  entry?: Array<{
    resource: EncounterResource | MediaResource
  }>
}

/**
 * Extracts the room name from a Daily.co room URL
 */
function extractRoomNameFromUrl(url: string): string | undefined {
  const urlParts = url.split('/')
  if (urlParts.length === 0) return undefined
  return urlParts[urlParts.length - 1]
}

/**
 * Fetches the download link for a Daily.co recording
 */
async function fetchRecordingDownloadLink(
  recordingId: string,
  dailyApiKey: string
): Promise<string | undefined> {
  try {
    const url = `https://api.daily.co/v1/recordings/${recordingId}/access-link`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dailyApiKey}`,
      },
    })

    if (response.status === 404) {
      // Recording link not available yet
      return undefined
    }

    if (response.status !== 200) {
      warn(
        `Failed to fetch recording link for ${recordingId}: HTTP ${response.status}`
      )
      return undefined
    }

    const data = (await response.json()) as DailyCoRecordingLink
    return data.download_link
  } catch (err) {
    error(`Error fetching recording link for ${recordingId}:`, err)
    return undefined
  }
}

/**
 * Syncs recordings for a single organization
 *
 * This function:
 * 1. Fetches all recordings from Daily.co
 * 2. For each encounter in the org, finds matching recordings by room name
 * 3. Creates/updates Media resources in the FHIR store
 */
async function syncOrgRecordings(orgId: string): Promise<{
  success: boolean
  recordingsFound: number
  mediaCreated: number
  mediaUpdated: number
  errors: string[]
}> {
  const errors: string[] = []
  let recordingsFound = 0
  let mediaCreated = 0
  let mediaUpdated = 0

  try {
    info(`Starting sync for org: ${orgId}`)

    // Fetch org configuration
    const orgDoc = await db.collection('orgs').doc(orgId).get()
    if (!orgDoc.exists) {
      warn(`Org ${orgId} not found`)
      return {
        success: false,
        recordingsFound: 0,
        mediaCreated: 0,
        mediaUpdated: 0,
        errors: ['Org not found'],
      }
    }

    const orgData = orgDoc.data() as OrgConfig
    const videoCallClient = orgData.frontendConfig?.videoCallClient

    // Check if this org uses Daily.co
    if (!videoCallClient || videoCallClient._tag !== 'daily_co_proxy') {
      info(`Org ${orgId} does not use Daily.co, skipping`)
      return {
        success: true,
        recordingsFound: 0,
        mediaCreated: 0,
        mediaUpdated: 0,
        errors: [],
      }
    }

    // Fetch Daily.co API key
    const secretsDoc = await db
      .collection('orgs')
      .doc(orgId)
      .collection('secrets')
      .doc('dailyCo')
      .get()

    const secrets = secretsDoc.data() as OrgSecrets | undefined
    const dailyApiKey = secrets?.apiKey

    if (!dailyApiKey) {
      warn(`No Daily.co API key found for org ${orgId}`)
      return {
        success: false,
        recordingsFound: 0,
        mediaCreated: 0,
        mediaUpdated: 0,
        errors: ['No Daily.co API key'],
      }
    }

    // Get FHIR store configuration
    const mediaRepoConfig = orgData.frontendConfig?.mediaRepository
    const encounterRepoConfig = orgData.frontendConfig?.encounterRepository

    if (!mediaRepoConfig || mediaRepoConfig._tag !== 'google_fhir_store') {
      warn(`Org ${orgId} does not have a FHIR store configured for Media`)
      return {
        success: false,
        recordingsFound: 0,
        mediaCreated: 0,
        mediaUpdated: 0,
        errors: ['No FHIR store configured for Media'],
      }
    }

    if (
      !encounterRepoConfig ||
      encounterRepoConfig._tag !== 'google_fhir_store'
    ) {
      warn(`Org ${orgId} does not have a FHIR store configured for Encounter`)
      return {
        success: false,
        recordingsFound: 0,
        mediaCreated: 0,
        mediaUpdated: 0,
        errors: ['No FHIR store configured for Encounter'],
      }
    }

    // Initialize Google Cloud authentication
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-healthcare'],
    })
    const authClient = await auth.getClient()
    const accessToken = await authClient.getAccessToken()

    if (!accessToken.token) {
      throw new Error('Failed to get access token')
    }

    const fhirBaseUrl = `https://healthcare.googleapis.com/v1/projects/${mediaRepoConfig.projectId}/locations/${mediaRepoConfig.region}/datasets/${mediaRepoConfig.dataset}/fhirStores/${mediaRepoConfig.storeId}/fhir`

    // Fetch all recordings from Daily.co
    const allRecordingsUrl = 'https://api.daily.co/v1/recordings'
    const allRecordingsResponse = await fetch(allRecordingsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dailyApiKey}`,
      },
    })

    if (allRecordingsResponse.status !== 200) {
      const errorMsg = `Failed to fetch recordings from Daily.co: HTTP ${allRecordingsResponse.status}`
      error(errorMsg)
      return {
        success: false,
        recordingsFound: 0,
        mediaCreated: 0,
        mediaUpdated: 0,
        errors: [errorMsg],
      }
    }

    const recordingsData =
      (await allRecordingsResponse.json()) as DailyCoRecordingsResponse
    const allRecordings = recordingsData.data

    recordingsFound = allRecordings.length
    info(`Found ${recordingsFound} total recordings for org ${orgId}`)

    // Group recordings by room name
    const recordingsByRoom = new Map<string, DailyCoRecording[]>()
    for (const recording of allRecordings) {
      const roomRecordings = recordingsByRoom.get(recording.room_name) || []
      roomRecordings.push(recording)
      recordingsByRoom.set(recording.room_name, roomRecordings)
    }

    // Fetch all encounters from FHIR store
    const encountersUrl = `${fhirBaseUrl}/Encounter`
    const encountersResponse = await fetch(encountersUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/fhir+json',
        Authorization: `Bearer ${accessToken.token}`,
      },
    })

    if (encountersResponse.status !== 200) {
      const errorMsg = `Failed to fetch encounters from FHIR store: HTTP ${encountersResponse.status}`
      error(errorMsg)
      errors.push(errorMsg)
      return {
        success: false,
        recordingsFound,
        mediaCreated: 0,
        mediaUpdated: 0,
        errors,
      }
    }

    const encountersBundle = (await encountersResponse.json()) as FhirBundle
    const encounters =
      encountersBundle.entry?.map((e) => e.resource as EncounterResource) || []

    info(`Found ${encounters.length} encounters for org ${orgId}`)

    // Process each encounter
    for (const encounter of encounters) {
      try {
        const roomUrl = encounter.location?.[0]?.location?.identifier?.value
        if (!roomUrl) {
          continue
        }

        const roomName = extractRoomNameFromUrl(roomUrl)
        if (!roomName) {
          continue
        }

        const recordings = recordingsByRoom.get(roomName)
        if (!recordings || recordings.length === 0) {
          continue
        }

        info(
          `Processing ${recordings.length} recordings for encounter ${encounter.id}`
        )

        // Fetch existing Media resources for this encounter
        const mediaSearchUrl = `${fhirBaseUrl}/Media?encounter=${encodeURIComponent(`Encounter/${encounter.id}`)}`
        const mediaSearchResponse = await fetch(mediaSearchUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/fhir+json',
            Authorization: `Bearer ${accessToken.token}`,
          },
        })

        if (mediaSearchResponse.status !== 200) {
          warn(
            `Failed to fetch media for encounter ${encounter.id}: HTTP ${mediaSearchResponse.status}`
          )
          continue
        }

        const mediaBundle = (await mediaSearchResponse.json()) as FhirBundle
        const existingMedia =
          mediaBundle.entry?.map((e) => e.resource as MediaResource) || []

        // Create a map of existing media by recording ID
        const existingMediaMap = new Map<string, MediaResource>()
        for (const media of existingMedia) {
          const recordingId = media.identifier?.find((id) => id.value)?.value
          if (recordingId) {
            existingMediaMap.set(recordingId, media)
          }
        }

        // Process each recording
        for (const recording of recordings) {
          try {
            // Fetch download link
            const downloadLink = await fetchRecordingDownloadLink(
              recording.id,
              dailyApiKey
            )

            if (!downloadLink) {
              warn(
                `Recording ${recording.id} does not have a download link yet`
              )
              continue
            }

            const existingMedia = existingMediaMap.get(recording.id)

            if (existingMedia) {
              // Update existing Media resource with fresh URL
              const updatedMedia = {
                ...existingMedia,
                content: {
                  url: downloadLink,
                },
              }

              const updateUrl = `${fhirBaseUrl}/Media/${existingMedia.id}`
              const updateResponse = await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/fhir+json',
                  Authorization: `Bearer ${accessToken.token}`,
                },
                body: JSON.stringify(updatedMedia),
              })

              if (updateResponse.status !== 200) {
                warn(
                  `Failed to update Media ${existingMedia.id}: HTTP ${updateResponse.status}`
                )
                errors.push(
                  `Failed to update Media ${existingMedia.id}: HTTP ${updateResponse.status}`
                )
                continue
              }

              mediaUpdated++
              info(
                `Updated Media resource ${existingMedia.id} for recording ${recording.id}`
              )
            } else {
              // Create new Media resource
              const newMedia: MediaResource = {
                resourceType: 'Media',
                status: 'completed',
                identifier: [{ value: recording.id }],
                createdDateTime: new Date(
                  recording.start_ts * 1000
                ).toISOString(),
                duration: recording.duration,
                content: { url: downloadLink },
                encounter: { reference: `Encounter/${encounter.id}` },
              }

              const createUrl = `${fhirBaseUrl}/Media`
              const createResponse = await fetch(createUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/fhir+json',
                  Authorization: `Bearer ${accessToken.token}`,
                },
                body: JSON.stringify(newMedia),
              })

              if (createResponse.status !== 201) {
                warn(
                  `Failed to create Media for recording ${recording.id}: HTTP ${createResponse.status}`
                )
                errors.push(
                  `Failed to create Media for recording ${recording.id}: HTTP ${createResponse.status}`
                )
                continue
              }

              mediaCreated++
              info(`Created Media resource for recording ${recording.id}`)
            }
          } catch (err) {
            const errorMsg = `Error processing recording ${recording.id}: ${err}`
            error(errorMsg)
            errors.push(errorMsg)
          }
        }
      } catch (err) {
        const errorMsg = `Error syncing encounter ${encounter.id}: ${err}`
        error(errorMsg)
        errors.push(errorMsg)
      }
    }

    info(
      `Completed sync for org ${orgId}: ${mediaCreated} media created, ${mediaUpdated} media updated, ${errors.length} errors`
    )
    return {
      success: errors.length === 0,
      recordingsFound,
      mediaCreated,
      mediaUpdated,
      errors,
    }
  } catch (err) {
    const errorMsg = `Error syncing org ${orgId}: ${err}`
    error(errorMsg)
    errors.push(errorMsg)
    return {
      success: false,
      recordingsFound,
      mediaCreated,
      mediaUpdated,
      errors,
    }
  }
}

/**
 * Cloud Function that syncs Daily.co recordings for all organizations
 * Scheduled to run every hour
 */
export const syncDailyCoRecordings = onSchedule(
  {
    schedule: 'every 1 hours',
    timeZone: 'America/Toronto',
    timeoutSeconds: 540, // 9 minutes
    memory: '512MiB',
  },
  async (event) => {
    info('Starting Daily.co recordings sync', { event })

    try {
      // Fetch all organizations
      const orgsSnapshot = await db.collection('orgs').get()
      const orgIds = orgsSnapshot.docs.map((doc) => doc.id)

      info(`Found ${orgIds.length} organizations to sync`)

      const results = await Promise.allSettled(
        orgIds.map((orgId) => syncOrgRecordings(orgId))
      )

      // Collect results
      const failedOrgs: Array<{
        orgId: string
        errors: string[]
      }> = []
      let totalRecordings = 0
      let totalMediaCreated = 0
      let totalMediaUpdated = 0

      results.forEach((result, index) => {
        const orgId = orgIds[index]
        if (result.status === 'rejected') {
          failedOrgs.push({ orgId, errors: [String(result.reason)] })
        } else if (!result.value.success) {
          failedOrgs.push({ orgId, errors: result.value.errors })
        } else {
          totalRecordings += result.value.recordingsFound
          totalMediaCreated += result.value.mediaCreated
          totalMediaUpdated += result.value.mediaUpdated
        }
      })

      if (failedOrgs.length > 0) {
        error(
          `Sync completed with failures for ${failedOrgs.length} orgs:`,
          failedOrgs
        )
        // TODO: Implement admin notification for repeated failures
        // This could be done by:
        // 1. Storing failure counts in Firestore
        // 2. Sending email/Slack notifications when threshold is reached
        // 3. Creating an alert in the admin dashboard
      } else {
        info(
          `All ${orgIds.length} organizations synced successfully. Found ${totalRecordings} recordings, created ${totalMediaCreated} media, updated ${totalMediaUpdated} media.`
        )
      }
    } catch (err) {
      error('Fatal error during sync:', err)
      throw err
    }
  }
)

/**
 * Manually triggered cloud function to sync Daily.co recordings
 * Can be called by admins for on-demand synchronization
 */
export const syncDailyCoRecordingsManual = onCall(
  {
    ...defaultHttpOptions,
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async (request) => {
    info('Manual Daily.co recordings sync triggered', {
      uid: request.auth?.uid,
    })

    // TODO: Add authentication check to ensure only admins can trigger this
    // const uid = request.auth?.uid
    // if (!uid) {
    //   throw new Error('Unauthorized: No user ID')
    // }

    try {
      // Fetch all organizations
      const orgsSnapshot = await db.collection('orgs').get()
      const orgIds = orgsSnapshot.docs.map((doc) => doc.id)

      info(`Found ${orgIds.length} organizations to sync`)

      const results = await Promise.allSettled(
        orgIds.map((orgId) => syncOrgRecordings(orgId))
      )

      // Collect results
      const failedOrgs: Array<{
        orgId: string
        errors: string[]
      }> = []
      const successfulOrgs: Array<{
        orgId: string
        recordingsFound: number
        mediaCreated: number
        mediaUpdated: number
      }> = []

      results.forEach((result, index) => {
        const orgId = orgIds[index]
        if (result.status === 'rejected') {
          failedOrgs.push({ orgId, errors: [String(result.reason)] })
        } else if (!result.value.success) {
          failedOrgs.push({ orgId, errors: result.value.errors })
        } else {
          successfulOrgs.push({
            orgId,
            recordingsFound: result.value.recordingsFound,
            mediaCreated: result.value.mediaCreated,
            mediaUpdated: result.value.mediaUpdated,
          })
        }
      })

      return {
        success: true,
        totalOrgs: orgIds.length,
        successfulOrgs: successfulOrgs.length,
        failedOrgs: failedOrgs.length,
        results: {
          successful: successfulOrgs,
          failed: failedOrgs,
        },
      }
    } catch (err) {
      error('Fatal error during manual sync:', err)
      throw err
    }
  }
)
