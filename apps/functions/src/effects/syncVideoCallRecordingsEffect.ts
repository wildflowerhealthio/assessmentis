import { Effect, Layer, Schema } from 'effect'
import { info, error as logError } from 'firebase-functions/logger'
import type { VideoCallRoomName } from '@assessmentis/video-call-domain'
import {
  VideoCallClient,
  type MediaWithRoom,
} from '@assessmentis/video-call-domain'
import { FhirR4Client } from '@assessmentis/fhir-client'
import {
  CurrentOrg,
  DocumentStore,
  LoadedOrgLayer,
  Org,
  OrgSlug,
} from '@assessmentis/platform-domain'
import type { ExternalAssertionError, AuthError } from '@assessmentis/ontology'
import { UnhandledError, NotFoundError } from '@assessmentis/ontology'
import { FirebaseAdmin } from '@assessmentis/firebase-server-infrastructure'
import { Media } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { VideoCallClientLayerFromOrg } from '../layers/VideoCallClientService'
import { FhirR4ClientLayerLive } from '../layers/FhirR4ClientService'

const ROOM_IDENTIFIER_SYSTEM = 'http://assessment.is/fhir/video-call-room-name'

interface SyncOrgResult {
  orgSlug: string
  recordingsSynced: number
  transcriptsSynced: number
  error?: string
}

/**
 * Sync recordings and transcripts for a single org.
 * Requires VideoCallClient, FhirR4Client, and DocumentStore to be provided.
 */
const syncSingleOrgInner = (
  orgSlug: OrgSlug
): Effect.Effect<
  SyncOrgResult,
  | UnhandledError
  | ExternalAssertionError
  | AuthError
  | NotFoundError<'Transcript', { id: string }>
  | NotFoundError<'Recording', { id: string }>,
  VideoCallClient | FhirR4Client | DocumentStore
> =>
  Effect.gen(function* () {
    const videoCallClient = yield* VideoCallClient
    const fhirClient = yield* FhirR4Client
    const documentStore = yield* DocumentStore

    // Get org data for sync timestamps
    const orgData = yield* documentStore.get('orgs', orgSlug).pipe(
      Effect.mapError((e) =>
        e instanceof NotFoundError
          ? new UnhandledError({
              message: `Org document not found for ${orgSlug}`,
              cause: e,
            })
          : e
      ),
      Effect.flatMap((data) =>
        Schema.decodeUnknown(Org)(data).pipe(
          Effect.mapError(
            (cause) =>
              new UnhandledError({
                message: 'Error decoding org data',
                cause,
              })
          )
        )
      )
    )

    const lastRecordingSync = orgData.lastRecordingSyncTimestamp
    const lastTranscriptSync = orgData.lastTranscriptSyncTimestamp

    info(
      `Syncing recordings for org ${orgSlug} since ${lastRecordingSync ?? 'beginning'}`
    )
    info(
      `Syncing transcripts for org ${orgSlug} since ${lastTranscriptSync ?? 'beginning'}`
    )

    // Fetch all recordings and transcripts since last sync
    const [recordings, transcripts] = yield* Effect.all([
      videoCallClient.listAllRecordings(lastRecordingSync),
      videoCallClient.listAllTranscripts(lastTranscriptSync),
    ])

    info(
      `Found ${recordings.length} recordings and ${transcripts.length} transcripts for org ${orgSlug}`
    )

    // Cache room URLs to avoid redundant API calls
    const roomUrlCache = new Map<string, string>()
    const getRoomUrl = (
      roomName: VideoCallRoomName
    ): Effect.Effect<
      string,
      | UnhandledError
      | ExternalAssertionError
      | AuthError
      | NotFoundError<'Room', { name: VideoCallRoomName }>
    > => {
      const cached = roomUrlCache.get(roomName)
      if (cached) return Effect.succeed(cached)

      return videoCallClient.getRoom(roomName).pipe(
        Effect.map((room) => {
          roomUrlCache.set(roomName, room.url)
          return room.url
        })
      )
    }

    let recordingsSynced = 0
    let transcriptsSynced = 0

    // Process recordings
    for (const recording of recordings) {
      const synced = yield* syncMediaToFhir(
        fhirClient,
        recording,
        getRoomUrl
      ).pipe(
        Effect.catchAll((e) => {
          logError(
            `Error syncing recording ${recording.media.identifier?.[0]?.value} for org ${orgSlug}:`,
            String(e)
          )
          return Effect.succeed(false)
        })
      )
      if (synced) recordingsSynced++
    }

    // Process transcripts
    for (const transcript of transcripts) {
      const synced = yield* syncMediaToFhir(
        fhirClient,
        transcript,
        getRoomUrl
      ).pipe(
        Effect.catchAll((e) => {
          logError(
            `Error syncing transcript ${transcript.media.identifier?.[0]?.value} for org ${orgSlug}:`,
            String(e)
          )
          return Effect.succeed(false)
        })
      )
      if (synced) transcriptsSynced++
    }

    // Update sync timestamps
    const now = Date.now()
    yield* documentStore.update(
      {
        lastRecordingSyncTimestamp: now,
        lastTranscriptSyncTimestamp: now,
        lastSyncError: undefined,
      },
      'orgs',
      orgSlug
    )

    info(
      `Sync complete for org ${orgSlug}: ${recordingsSynced} recordings, ${transcriptsSynced} transcripts synced`
    )

    return {
      orgSlug: orgSlug as string,
      recordingsSynced,
      transcriptsSynced,
    } satisfies SyncOrgResult
  })

/**
 * Sync a single media item (recording or transcript) to FHIR.
 * Returns true if the media was synced (created or updated), false if skipped.
 */
const syncMediaToFhir = (
  fhirClient: typeof FhirR4Client.Service,
  mediaWithRoom: MediaWithRoom,
  getRoomUrl: (
    roomName: VideoCallRoomName
  ) => Effect.Effect<
    string,
    | UnhandledError
    | ExternalAssertionError
    | AuthError
    | NotFoundError<'Room', { name: VideoCallRoomName }>
  >
): Effect.Effect<
  boolean,
  | UnhandledError
  | ExternalAssertionError
  | AuthError
  | NotFoundError<'Room', { name: VideoCallRoomName }>
  | NotFoundError<'Encounter', { id: string }>
> =>
  Effect.gen(function* () {
    const { media, roomName } = mediaWithRoom
    const mediaIdentifier = media.identifier?.[0]?.value
    if (!mediaIdentifier) return false

    // Get the full room URL for encounter lookup
    const roomUrl = yield* getRoomUrl(roomName)

    // Search for Encounter with matching location identifier
    const encounterSearchResult = yield* fhirClient
      .search({
        resourceType: 'Encounter',
        'location:identifier': `${ROOM_IDENTIFIER_SYSTEM}|${roomUrl}`,
      })
      .pipe(
        Effect.mapError(
          (e) =>
            new UnhandledError({
              message: 'Error searching for encounter',
              cause: e,
            })
        )
      )

    const encounterBundle = encounterSearchResult as {
      entry?: Array<{
        resource?: { id: string; resourceType: string }
      }>
    }

    const encounterEntry = encounterBundle.entry?.[0]?.resource
    if (!encounterEntry?.id) {
      // No encounter found for this room - skip
      return false
    }

    const encounterId = encounterEntry.id

    // Check if Media with this identifier already exists
    const mediaSearchResult = yield* fhirClient
      .search({
        resourceType: 'Media',
        identifier: mediaIdentifier,
        encounter: `Encounter/${encounterId}`,
      })
      .pipe(
        Effect.mapError(
          (e) =>
            new UnhandledError({
              message: 'Error searching for existing media',
              cause: e,
            })
        )
      )

    const mediaBundle = mediaSearchResult as {
      entry?: Array<{
        resource?: { id: string; resourceType: string }
      }>
    }

    const existingMedia = mediaBundle.entry?.[0]?.resource

    if (existingMedia?.id) {
      // Update existing Media with fresh URL
      yield* fhirClient
        .update({
          type: 'Media',
          id: existingMedia.id,
          resource: {
            ...existingMedia,
            content: media.content,
          },
        })
        .pipe(
          Effect.mapError(
            (e) =>
              new UnhandledError({
                message: `Error updating media ${existingMedia.id}`,
                cause: e,
              })
          )
        )
    } else {
      // Create new Media linked to the Encounter
      const encodedMedia = Schema.encodeSync(Media)(media)
      yield* fhirClient
        .create({
          type: 'Media',
          resource: {
            ...encodedMedia,
            encounter: {
              reference: `Encounter/${encounterId}`,
            },
          },
        })
        .pipe(
          Effect.mapError(
            (e) =>
              new UnhandledError({
                message: 'Error creating media',
                cause: e,
              })
          )
        )
    }

    return true
  })

/**
 * Main sync effect that processes all eligible orgs.
 * Requires FirebaseAdmin and DocumentStore to be provided.
 */
export const syncVideoCallRecordingsEffect = Effect.gen(function* () {
  const { firestore } = yield* FirebaseAdmin
  const documentStore = yield* DocumentStore

  // Query all org documents
  const orgsSnapshot = yield* Effect.tryPromise({
    try: () => firestore.collection('orgs').get(),
    catch: (cause) =>
      new UnhandledError({
        message: 'Error listing orgs from Firestore',
        cause,
      }),
  })

  // Filter to eligible orgs
  const eligibleOrgs = orgsSnapshot.docs.filter((doc) => {
    const data = doc.data()
    const vcClient = data?.frontendConfig?.videoCallClient
    return vcClient?._tag && vcClient._tag !== 'not_implemented'
  })

  info(
    `Found ${eligibleOrgs.length} eligible orgs out of ${orgsSnapshot.docs.length} total`
  )

  const results: SyncOrgResult[] = []

  for (const orgDoc of eligibleOrgs) {
    const orgSlug = OrgSlug.make(orgDoc.id)

    info(`Starting sync for org: ${orgSlug}`)

    // Build per-org layer
    const orgLayer = Layer.mergeAll(
      VideoCallClientLayerFromOrg,
      FhirR4ClientLayerLive
    ).pipe(
      Layer.provideMerge(LoadedOrgLayer),
      Layer.provide(
        Layer.mergeAll(
          Layer.succeed(CurrentOrg, orgSlug),
          Layer.succeed(DocumentStore, documentStore)
        )
      )
    )

    const result = yield* syncSingleOrgInner(orgSlug).pipe(
      Effect.provide(orgLayer),
      Effect.catchAll((e) => {
        const errorMsg = String(e)
        logError(`Sync failed for org ${orgSlug}:`, errorMsg)

        // Record error on org document
        return documentStore
          .update({ lastSyncError: errorMsg }, 'orgs', orgSlug)
          .pipe(
            Effect.catchAll(() => Effect.void),
            Effect.map(
              () =>
                ({
                  orgSlug: orgSlug as string,
                  recordingsSynced: 0,
                  transcriptsSynced: 0,
                  error: errorMsg,
                }) satisfies SyncOrgResult
            )
          )
      })
    )

    results.push(result)
  }

  info('Sync complete for all orgs:', JSON.stringify(results))
  return results
})
