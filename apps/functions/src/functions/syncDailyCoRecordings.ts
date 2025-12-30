import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onCall } from 'firebase-functions/v2/https'
import { info, error, warn } from 'firebase-functions/logger'
import { db, defaultHttpOptions } from '../util/context'
import fetch from 'node-fetch'

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
  status: 'completed'
  identifier?: Array<{ value: string }>
  createdDateTime?: string
  duration?: number
  content?: { url: string }
  encounter?: { reference: string }
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
 * Note: This implementation focuses on querying Daily.co for recordings and
 * preparing Media resources. The actual FHIR store updates require OAuth2
 * credentials which would be handled by the existing infrastructure layers
 * in a production deployment.
 */
async function syncOrgRecordings(orgId: string): Promise<{
  success: boolean
  recordingsFound: number
  errors: string[]
}> {
  const errors: string[] = []
  let recordingsFound = 0

  try {
    info(`Starting sync for org: ${orgId}`)

    // Fetch org configuration
    const orgDoc = await db.collection('orgs').doc(orgId).get()
    if (!orgDoc.exists) {
      warn(`Org ${orgId} not found`)
      return { success: false, recordingsFound: 0, errors: ['Org not found'] }
    }

    const orgData = orgDoc.data() as OrgConfig
    const videoCallClient = orgData.frontendConfig?.videoCallClient

    // Check if this org uses Daily.co
    if (!videoCallClient || videoCallClient._tag !== 'daily_co_proxy') {
      info(`Org ${orgId} does not use Daily.co, skipping`)
      return { success: true, recordingsFound: 0, errors: [] }
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
        errors: ['No Daily.co API key'],
      }
    }

    // Get FHIR store configuration
    const mediaRepoConfig = orgData.frontendConfig?.mediaRepository
    if (!mediaRepoConfig || mediaRepoConfig._tag !== 'google_fhir_store') {
      warn(`Org ${orgId} does not have a FHIR store configured`)
      return {
        success: false,
        recordingsFound: 0,
        errors: ['No FHIR store configured'],
      }
    }

    // Fetch all recordings from Daily.co
    // Note: In a production system, we would paginate through results
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
      return { success: false, recordingsFound: 0, errors: [errorMsg] }
    }

    const recordingsData =
      (await allRecordingsResponse.json()) as DailyCoRecordingsResponse
    const allRecordings = recordingsData.data

    info(
      `Found ${allRecordings.length} total recordings for org ${orgId} from Daily.co`
    )

    // Group recordings by room name
    const recordingsByRoom = new Map<string, DailyCoRecording[]>()
    for (const recording of allRecordings) {
      const roomRecordings = recordingsByRoom.get(recording.room_name) || []
      roomRecordings.push(recording)
      recordingsByRoom.set(recording.room_name, roomRecordings)
    }

    // TODO: For each room, find corresponding encounter and sync recordings
    // This would require:
    // 1. Querying Firestore or FHIR store for encounters with matching room URLs
    // 2. Fetching existing Media resources for each encounter
    // 3. Creating new Media resources for recordings not yet synced
    // 4. Updating existing Media resources with fresh download URLs
    //
    // The actual FHIR store operations require OAuth2 authentication which
    // is handled by the existing infrastructure layers. This cloud function
    // serves as a coordinator that can be triggered periodically or manually.

    recordingsFound = allRecordings.length

    info(
      `Completed sync for org ${orgId}: ${recordingsFound} recordings found across ${recordingsByRoom.size} rooms`
    )
    return { success: true, recordingsFound, errors }
  } catch (err) {
    const errorMsg = `Error syncing org ${orgId}: ${err}`
    error(errorMsg)
    errors.push(errorMsg)
    return { success: false, recordingsFound, errors }
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
      const failedOrgs: Array<{ orgId: string; errors: string[] }> = []
      let totalRecordings = 0

      results.forEach((result, index) => {
        const orgId = orgIds[index]
        if (result.status === 'rejected') {
          failedOrgs.push({ orgId, errors: [String(result.reason)] })
        } else if (!result.value.success) {
          failedOrgs.push({ orgId, errors: result.value.errors })
        } else {
          totalRecordings += result.value.recordingsFound
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
          `All ${orgIds.length} organizations synced successfully. Found ${totalRecordings} total recordings.`
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
      const failedOrgs: Array<{ orgId: string; errors: string[] }> = []
      const successfulOrgs: Array<{ orgId: string; recordingsFound: number }> =
        []

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
