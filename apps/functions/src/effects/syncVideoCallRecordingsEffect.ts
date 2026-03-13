/* eslint-disable @typescript-eslint/no-explicit-any */
import { Effect, Layer, pipe, Request, Schema, type Either } from 'effect'
import { info, error as logError } from 'firebase-functions/logger'

import {
  Media,
  type Encounter,
  type Location,
} from '@assessmentis/clinical-domain'
import { Reference } from '@assessmentis/clinical-domain/data-types'
import type {
  Hub,
  ResourceRequest,
  ReadonlyUrl,
  Resource,
} from '@assessmentis/effectful-store'
import { FhirR4Client } from '@assessmentis/fhir-r4'
import { FirebaseAdmin } from '@assessmentis/firebase-server-infrastructure'
import {
  BadDataError,
  NotFoundError,
  UnhandledError,
  type AuthError,
  type ExternalAssertionError,
} from '@assessmentis/ontology'
import {
  CurrentOrg,
  DocumentStore,
  LoadedOrgLayer,
  Org,
  OrgSlug,
} from '@assessmentis/platform-domain'
import {
  VideoCallClient,
  type MediaWithRoom,
  type VideoCallRoomName,
} from '@assessmentis/video-call-domain'

import { FhirR4ClientLayerLive } from '../layers/FhirR4ClientService'

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
  | BadDataError
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
          ? new BadDataError({
              message: `Org document not found for ${orgSlug}`,
              cause: e,
            })
          : e
      ),
      Effect.flatMap((data) =>
        Schema.decodeUnknown(Org)(data).pipe(
          Effect.mapError(
            (cause) =>
              new BadDataError({
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

    let recordingsSynced = 0
    let transcriptsSynced = 0

    // Process recordings
    for (const recording of recordings) {
      const synced = yield* syncMediaToFhir(fhirClient, recording).pipe(
        Effect.catchAll((e) => {
          logError(
            `Error syncing recording ${recording.media.identifier?.[0]?.value} for org ${orgSlug}:`,
            e
          )
          return Effect.succeed(false)
        })
      )
      if (synced) recordingsSynced++
    }

    // Process transcripts
    for (const transcript of transcripts) {
      const synced = yield* syncMediaToFhir(fhirClient, transcript).pipe(
        Effect.catchAll((e) => {
          logError(
            `Error syncing transcript ${transcript.media.identifier?.[0]?.value} for org ${orgSlug}:`,
            e
          )
          return Effect.succeed(false)
        })
      )
      if (synced) transcriptsSynced++
    }

    // Update sync timestamps
    const now = new Date(Date.now())
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
  mediaWithRoom: MediaWithRoom
): Effect.Effect<
  {
    mediaUpdates: Record<string, Either.Either<unknown, UnhandledError>>
    mediaCreations: Array<Either.Either<unknown, UnhandledError>>
  },
  | UnhandledError
  | ExternalAssertionError
  | AuthError
  | NotFoundError<'Room', { name: VideoCallRoomName }>
  | NotFoundError<'Encounter', { id: string }>,
  never
> =>
  Effect.gen(function* () {
    // TODO, supply this with a tag
    const hub: Hub.Hub<{
      Location: Location
      Encounter: Encounter
      Media: Media
    }> = {} as any
    const mediaUpdates: Record<
      string,
      Either.Either<unknown, UnhandledError>
    > = {}

    const mediaCreations = [] as Array<Either.Either<unknown, UnhandledError>>

    const { media } = mediaWithRoom
    const mediaUrl = media.identifier?.[0]?.value
    if (!mediaUrl) return { mediaUpdates, mediaCreations }

    // Get the full room URL for encounter lookup

    // Search for Encounter with matching location identifier
    const encounterSearchResult = yield* Effect.request(
      Request.of<ResourceRequest.Search<Encounter>>()({
        _tag: 'Search',
        origin: {} as any,
        domainType: 'Encounter',
        params: {},
      }),
      hub.resolver
    ).pipe(
      Effect.mapError(
        (e) =>
          new UnhandledError({
            message: 'Error searching for encounter',
            cause: e,
          })
      )
    )

    const encounterEntry = encounterSearchResult[0]
    if (!encounterEntry?.url) {
      // No encounter found for this room - skip
      return { mediaUpdates, mediaCreations }
    }

    // Check if Media with this identifier already exists
    const mediaSearchResult = yield* Effect.request(
      Request.of<ResourceRequest.Search<Media>>()({
        _tag: 'Search',
        origin: {} as any,
        domainType: 'Media',
        params: {
          url: mediaUrl,
          encounter: encounterEntry.url.toString(),
        },
      }),
      hub.resolver
    ).pipe(
      Effect.mapError(
        (e) =>
          new UnhandledError({
            message: 'Error searching for existing media',
            cause: e,
          })
      )
    )

    const existingMedia: (Media & { url: ReadonlyUrl }) | undefined =
      mediaSearchResult[0]

    if (existingMedia) {
      mediaUpdates[existingMedia.url.toString()] = yield* Effect.request(
        Request.of<ResourceRequest.Update<Media>>()({
          _tag: 'Update',
          domainType: 'Media',
          resource: Media.make({
            ...existingMedia,
            content: media.content,
          }) as Resource.WithResourceUrl<Media>,
          origin: {} as any,
        }),
        hub.resolver
      ).pipe(
        Effect.mapError(
          (e) =>
            new UnhandledError({
              message: `Error updating media ${existingMedia.url.toString()}`,
              cause: e,
            })
        ),
        Effect.either
      )
    } else {
      mediaCreations.push(
        yield* pipe(
          Effect.request(
            Request.of<ResourceRequest.Create<Media>>()({
              domainType: 'Media',
              resource: Media.make({
                ...media,
                encounter: Reference.make({
                  reference: encounterEntry.url.toString(),
                  type: 'Encounter',
                }),
              }),
              origin: {} as any,
              _tag: 'Create',
            } as const),
            hub.resolver
          ),
          Effect.mapError(
            (e) =>
              new UnhandledError({
                message: 'Error creating media',
                cause: e,
              })
          ),
          Effect.either
        )
      )
    }

    return { mediaUpdates, mediaCreations }
  }) as any

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

  // Filter to eligible orgs — those with a daily_co origin
  const eligibleOrgs = orgsSnapshot.docs.filter((doc) => {
    const data = doc.data() as { origins?: Record<string, { _tag?: string }> }
    const origins = data?.origins
    if (!origins) return false
    return Object.values(origins).some((def) => def._tag === 'daily_co')
  })

  info(
    `Found ${eligibleOrgs.length} eligible orgs out of ${orgsSnapshot.docs.length} total`
  )

  const results: SyncOrgResult[] = []

  for (const orgDoc of eligibleOrgs) {
    const orgSlug = OrgSlug.make(orgDoc.id)

    info(`Starting sync for org: ${orgSlug}`)

    // Build per-org layer
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
