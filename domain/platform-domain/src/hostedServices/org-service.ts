import {
  Context,
  Data,
  Effect,
  Either,
  Fiber,
  Option,
  PubSub,
  Queue,
  Schema,
  Stream,
  Take,
} from 'effect'
import type { Scope } from 'effect'

import { BadDataError, NotFoundError } from '@assessmentis/ontology'
import type { UnhandledError } from '@assessmentis/ontology'
import { DocumentStore, Org } from '@assessmentis/platform-domain'
import type { OrgSlug } from '@assessmentis/platform-domain'
import { StreamEither, pubsubAsPerpetualStream, takeOneFromPubSubOrDie } from '@assessmentis/util'

/**
 * Creates a sliding `PubSub` (capacity 1, replay 1) for broadcasting the
 * currently selected {@link OrgSlug}.
 */
const createOrgSlugPubSub = PubSub.sliding<Take.Take<Either.Either<OrgSlug, NoSelectedOrgError>>>({
  capacity: 1,
  replay: 1,
})

/**
 * Creates a sliding `PubSub` (capacity 1, replay 1) for broadcasting the
 * resolved {@link Org} corresponding to the selected slug.
 */
const createOrgPubSub = PubSub.sliding<
  Take.Take<
    Either.Either<
      Org,
      | NoSelectedOrgError
      | NotFoundError<'Org', { orgSlug: OrgSlug }>
      | BadDataError
      | UnhandledError
    >
  >
>({
  capacity: 1,
  replay: 1,
})

/** Raised when no organization has been selected yet. */
class NoSelectedOrgError extends Data.TaggedError('NoSelectedOrgError')<object> {
  constructor() {
    super({})
    this.name = 'NoSelectedOrgError'
    this.message = 'No organization is currently selected.'
    this.stack = new Error().stack
  }
}

/**
 * Client-side reactive service for organization selection and resolution.
 *
 * @remarks
 * Manages the currently selected {@link OrgSlug} and resolves it into a
 * full {@link Org} via {@link DocumentStore}. Both the slug and the resolved
 * org are available as one-shot effects or continuous streams. Initialized
 * by `PlatformContextProvider`.
 */
class OrgService extends Context.Tag('OrgService')<
  OrgService,
  {
    /** Set (or clear) the active organization. `None` deselects. */
    setActiveOrgSlug: (maybeOrgSlug: Option.Option<OrgSlug>) => Effect.Effect<void, never>
    /** One-shot read of the current org slug. */
    orgSlug: Effect.Effect<OrgSlug, NoSelectedOrgError, Scope.Scope>
    /** Stream of org slug changes (or {@link NoSelectedOrgError} when none is selected). */
    orgSlugStream: Stream.Stream<Either.Either<OrgSlug, NoSelectedOrgError>, never, Scope.Scope>
    /** Stream of resolved {@link Org} updates, switching on slug changes. */
    activeOrgStream: Stream.Stream<
      Either.Either<
        Org,
        | NoSelectedOrgError
        | NotFoundError<'Org', { orgSlug: OrgSlug }>
        | BadDataError
        | UnhandledError
      >,
      never,
      Scope.Scope
    >
    /** One-shot read of the currently resolved org. */
    activeOrg: Effect.Effect<
      Org,
      | NoSelectedOrgError
      | NotFoundError<'Org', { orgSlug: OrgSlug }>
      | BadDataError
      | UnhandledError
    >
    /** Shuts down both PubSubs and joins the daemon fiber. */
    shutdown: Effect.Effect<void, never>
  }
>() {}

const decodeOrg = (data: unknown): Effect.Effect<Org, BadDataError> =>
  Schema.decodeUnknown(Org)(data).pipe(
    Effect.mapError(
      (cause) =>
        new BadDataError({
          cause,
          message: "The org model couldn't be parsed",
        })
    )
  )

/**
 * Boots the {@link OrgService} by wiring the slug and org PubSubs to
 * a {@link DocumentStore} watch. Returns the fully wired service value.
 *
 * @param orgSlugPubSub - PubSub carrying the selected slug (or no-selection error)
 * @param orgPubSub - PubSub carrying the resolved org (or lookup errors)
 */
const startOrgService = (
  orgSlugPubSub: PubSub.PubSub<Take.Take<Either.Either<OrgSlug, NoSelectedOrgError>>>,
  orgPubSub: PubSub.PubSub<
    Take.Take<
      Either.Either<
        Org,
        | NoSelectedOrgError
        | NotFoundError<'Org', { orgSlug: OrgSlug }>
        | BadDataError
        | UnhandledError
      >
    >
  >
): Effect.Effect<typeof OrgService.Service, never, DocumentStore | Scope.Scope> =>
  Effect.gen(function* startOrgServiceGen() {
    const documentStore = yield* DocumentStore

    yield* orgSlugPubSub.publish(
      // TODO: Replace with last selected org slug from persistent storage
      Take.of(Either.left(new NoSelectedOrgError()))
    )

    const orgPubSubFiber = yield* Effect.forkDaemon(
      Stream.runIntoPubSub(
        pubsubAsPerpetualStream(orgSlugPubSub).pipe(
          StreamEither.flatMap(
            (orgSlug) =>
              documentStore.subscribeTo('orgs', orgSlug).pipe(
                StreamEither.mapLeft((cause) => {
                  if (cause instanceof NotFoundError) {
                    return new NotFoundError<'Org', { orgSlug: OrgSlug }>({
                      params: { orgSlug },
                      resourceType: 'Org',
                    })
                  }
                  return cause
                }),
                StreamEither.mapEffect((data) => decodeOrg(data))
              ),
            { switch: true }
          )
        ),
        orgPubSub
      )
    )

    const shutdown = Effect.gen(function* shutdown() {
      yield* orgPubSub.shutdown
      yield* orgSlugPubSub.shutdown

      yield* Fiber.joinAll([orgPubSubFiber])
    })

    const service: typeof OrgService.Service = {
      activeOrg: takeOneFromPubSubOrDie(orgPubSub),
      activeOrgStream: pubsubAsPerpetualStream(orgPubSub),
      orgSlug: takeOneFromPubSubOrDie(orgSlugPubSub),
      orgSlugStream: pubsubAsPerpetualStream(orgSlugPubSub),
      setActiveOrgSlug: (maybeOrgSlug: Option.Option<OrgSlug>) => {
        return orgSlugPubSub
          .publish(
            Option.match(maybeOrgSlug, {
              onNone: () => Take.of(Either.left(new NoSelectedOrgError())),
              onSome: (slug) => Take.of(Either.right(slug)),
            })
          )
          .pipe(
            Effect.flatMap((_) => {
              return orgSlugPubSub.subscribe.pipe(Effect.flatMap(Queue.takeAll))
            }),
            Effect.scoped
          )
      },
      shutdown,
    }
    return service
  })

export { createOrgSlugPubSub, createOrgPubSub, NoSelectedOrgError, OrgService, startOrgService }
