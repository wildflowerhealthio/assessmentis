import { Effect, Layer, Schema, pipe } from 'effect'
import type { Either } from 'effect'
import { info, error as logError } from 'firebase-functions/logger'

import { ClinicalDomainHub, Encounter, Media } from '@assessmentis/clinical-domain'
import { Reference } from '@assessmentis/clinical-domain/data-types'
import { Resource } from '@assessmentis/effectful-store'
import { FirebaseAdmin } from '@assessmentis/firebase-server-infrastructure'
import { BadDataError, NotFoundError, UnhandledError } from '@assessmentis/ontology'
import type { AuthError, ExternalAssertionError } from '@assessmentis/ontology'
import {
  CurrentOrg,
  DocumentStore,
  LoadedOrgLayer,
  Org,
  OrgSlug,
} from '@assessmentis/platform-domain'
import { VideoCallClient } from '@assessmentis/video-call-domain'
import type { MediaWithRoom, VideoCallRoomName } from '@assessmentis/video-call-domain'

import { FhirR4ClientLayerLive } from '../layers/fhir-r4-client-service'

interface SyncOrgResult {
  orgSlug: string
  recordingsSynced: number
  transcriptsSynced: number
  error?: string
}

/**
 * Sync recordings and transcripts for a single org.
 * Requires VideoCallClient, ClinicalDomainHub, and DocumentStore to be provided.
 */
const syncSingleOrgInner = (
  orgSlug: OrgSlug
): Effect.Effect<
  SyncOrgResult,
  | UnhandledError
  | ExternalAssertionError
  | AuthError
  | BadDataError
  | NotFoundError<'Transcript', { id: string }>
  | NotFoundError<'Recording', { id: string }>,
  VideoCallClient | ClinicalDomainHub | DocumentStore
> =>
  Effect.gen(function* syncSingleOrgInnerGen() {
    const videoCallClient = yield* VideoCallClient
    const documentStore = yield* DocumentStore

    // Get org data for sync timestamps
    const orgData = yield* documentStore.get(['orgs', orgSlug]).pipe(
      Effect.mapError((e) => {
        if (e instanceof NotFoundError) {
          return new BadDataError({
            cause: e,
            message: `Org document not found for ${orgSlug}`,
          })
        }
        return e
      }),
      Effect.flatMap((data) =>
        Schema.decodeUnknown(Org)(data).pipe(
          Effect.mapError(
            (cause) =>
              new BadDataError({
                cause,
                message: 'Error decoding org data',
              })
          )
        )
      )
    )

    const lastRecordingSync = orgData.lastRecordingSyncTimestamp
    const lastTranscriptSync = orgData.lastTranscriptSyncTimestamp

    info(
      `Syncing recordings for org ${orgSlug} since ${lastRecordingSync?.toString() ?? 'beginning'}`
    )
    info(
      `Syncing transcripts for org ${orgSlug} since ${lastTranscriptSync?.toString() ?? 'beginning'}`
    )

    // Fetch all recordings and transcripts since last sync
    const [recordings, transcripts] = yield* Effect.all([
      videoCallClient.listAllRecordings(lastRecordingSync),
      videoCallClient.listAllTranscripts(lastTranscriptSync),
    ])

    info(
      `Found ${recordings.length} recordings and ${transcripts.length} transcripts for org ${orgSlug}`
    )

    let recordingsSynced = 0
    let transcriptsSynced = 0

    // Process recordings
    for (const recording of recordings) {
      const synced = yield* syncMediaToFhir(recording).pipe(
        Effect.catchAll((e) => {
          logError(
            `Error syncing recording ${recording.media.identifier?.[0]?.value} for org ${orgSlug}:`,
            e
          )
          return Effect.succeed(false)
        })
      )
      if (synced) {
        recordingsSynced++
      }
    }

    // Process transcripts
    for (const transcript of transcripts) {
      const synced = yield* syncMediaToFhir(transcript).pipe(
        Effect.catchAll((e) => {
          logError(
            `Error syncing transcript ${transcript.media.identifier?.[0]?.value} for org ${orgSlug}:`,
            e
          )
          return Effect.succeed(false)
        })
      )
      if (synced) {
        transcriptsSynced++
      }
    }

    // Update sync timestamps
    const now = new Date(Date.now())
    yield* documentStore.update(
      {
        lastRecordingSyncTimestamp: now,
        lastSyncError: undefined,
        lastTranscriptSyncTimestamp: now,
      },
      ['orgs', orgSlug]
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
  mediaWithRoom: MediaWithRoom
): Effect.Effect<
  {
    mediaUpdates: Record<string, Either.Either<unknown, UnhandledError>>
    mediaCreations: Either.Either<unknown, UnhandledError>[]
  },
  | UnhandledError
  | ExternalAssertionError
  | AuthError
  | NotFoundError<'Room', { name: VideoCallRoomName }>
  | NotFoundError<'Encounter', { id: string }>,
  ClinicalDomainHub
> =>
  Effect.gen(function* syncMediaToFhirGen() {
    const hub = yield* ClinicalDomainHub
    const mediaUpdates: Record<string, Either.Either<unknown, UnhandledError>> = {}

    const mediaCreations = [] as Either.Either<unknown, UnhandledError>[]

    const { media } = mediaWithRoom
    const mediaUrl = media.identifier?.[0]?.value
    if (!mediaUrl) {
      return { mediaUpdates, mediaCreations }
    }

    // Search for Encounter with matching location identifier
    const encounterSearchResult = yield* hub.search(Encounter, {}).pipe(
      Effect.mapError(
        (e) =>
          new UnhandledError({
            cause: e,
            message: 'Error searching for encounter',
          })
      )
    )

    const encounterEntry = encounterSearchResult[0]
    if (!encounterEntry?.url) {
      // No encounter found for this room - skip
      return { mediaCreations, mediaUpdates }
    }

    // Check if Media with this identifier already exists
    const mediaSearchResult = yield* hub
      .search(Media, {
        encounter: encounterEntry.url.toString(),
        url: mediaUrl,
      })
      .pipe(
        Effect.mapError(
          (e) =>
            new UnhandledError({
              cause: e,
              message: 'Error searching for existing media',
            })
        )
      )

    const existingMedia = mediaSearchResult[0]

    if (existingMedia) {
      const updatedMedia = existingMedia.cloneWith({
        content: media.content,
      })

      if (!Resource.hasResourceUrl(updatedMedia)) {
        return yield* Effect.fail(
          new UnhandledError({
            message: 'Updated media lost its url during construction',
          })
        )
      }

      mediaUpdates[existingMedia.url.toString()] = yield* hub.update(Media, updatedMedia).pipe(
        Effect.mapError(
          (e) =>
            new UnhandledError({
              cause: e,
              message: `Error updating media ${existingMedia.url.toString()}`,
            })
        ),
        Effect.either
      )
    } else {
      mediaCreations.push(
        yield* pipe(
          hub.create(
            Media,
            media.cloneWith({
              encounter: Reference.make({
                reference: encounterEntry.url.toString(),
                type: 'Encounter',
              }),
            })
          ),
          Effect.mapError(
            (e) =>
              new UnhandledError({
                cause: e,
                message: 'Error creating media',
              })
          ),
          Effect.either
        )
      )
    }

    return { mediaCreations, mediaUpdates }
  })

/**
 * Main sync effect that processes all eligible orgs.
 * Requires FirebaseAdmin and DocumentStore to be provided.
 */
export const syncVideoCallRecordingsEffect = Effect.gen(function* syncVideoCallRecordingsEffect() {
  const { firestore } = yield* FirebaseAdmin
  const documentStore = yield* DocumentStore

  // Query all org documents
  const orgsSnapshot = yield* Effect.tryPromise({
    catch: (cause) =>
      new UnhandledError({
        message: 'Error listing orgs from Firestore',
        cause,
      }),
    try: () => firestore.collection('orgs').get(),
  })

  // Filter to eligible orgs — those with a daily_co origin
  const eligibleOrgs = orgsSnapshot.docs.filter((doc) => {
    const data = doc.data() as { origins?: Record<string, { _tag?: string }> }
    const origins = data?.origins
    if (!origins) {
      return false
    }
    return Object.values(origins).some((def) => def._tag === 'daily_co')
  })

  info(`Found ${eligibleOrgs.length} eligible orgs out of ${orgsSnapshot.docs.length} total`)

  const results: SyncOrgResult[] = []

  for (const orgDoc of eligibleOrgs) {
    const orgSlug = OrgSlug.make(orgDoc.id)

    info(`Starting sync for org: ${orgSlug}`)

    // Build per-org layer
    // TODO: Add ClinicalDomainHub layer once backend Hub wiring is implemented
    const orgLayer = Layer.provideMerge(
      FhirR4ClientLayerLive,
      Layer.provideMerge(
        LoadedOrgLayer,
        Layer.mergeAll(
          Layer.succeed(CurrentOrg, orgSlug),
          Layer.succeed(DocumentStore, documentStore)
        )
      )
    )

    const result = yield* syncSingleOrgInner(orgSlug).pipe(
      Effect.provide(orgLayer),
      Effect.catchAll((e) => {
        const errorMsg = JSON.stringify(e, null, 2)
        logError(`Sync failed for org ${orgSlug}:`, e)

        // Record error on org document
        return documentStore.update({ lastSyncError: errorMsg }, ['orgs', orgSlug]).pipe(
          Effect.catchAll(() => Effect.void),
          Effect.map(
            () =>
              ({
                error: errorMsg,
                orgSlug: orgSlug as string,
                recordingsSynced: 0,
                transcriptsSynced: 0,
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
