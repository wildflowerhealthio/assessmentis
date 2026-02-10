import {
  Effect,
  Option,
  Stream,
  Scope,
  Take,
  PubSub,
  Schema,
  Fiber,
  Data,
  Context,
  Queue,
  Either,
} from 'effect'
import { DocumentStore, Org, OrgSlug } from '@assessmentis/platform-domain'
import {
  BadDataError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import {
  pubsubAsPerpetualStream,
  StreamEither,
  takeOneFromPubSubOrDie,
} from '@assessmentis/util'

export const createOrgSlugPubSub = PubSub.sliding<
  Take.Take<Either.Either<OrgSlug, NoSelectedOrgError>>
>({
  capacity: 1,
  replay: 1,
})

export const createOrgPubSub = PubSub.sliding<
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

export class NoSelectedOrgError extends Data.TaggedError(
  'NoSelectedOrgError'
)<object> {
  constructor() {
    super({})
    this.name = 'NoSelectedOrgError'
    this.message = 'No organization is currently selected.'
    this.stack = new Error().stack
  }
}

export class OrgService extends Context.Tag('OrgService')<
  OrgService,
  {
    setActiveOrgSlug: (
      maybeOrgSlug: Option.Option<OrgSlug>
    ) => Effect.Effect<void, never, never>
    orgSlug: Effect.Effect<OrgSlug, NoSelectedOrgError, Scope.Scope>
    orgSlugStream: Stream.Stream<
      Either.Either<OrgSlug, NoSelectedOrgError>,
      never,
      Scope.Scope
    >
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
    activeOrg: Effect.Effect<
      Org,
      | NoSelectedOrgError
      | NotFoundError<'Org', { orgSlug: OrgSlug }>
      | BadDataError
      | UnhandledError
    >
    shutdown: Effect.Effect<void, never, never>
  }
>() {}

const decodeOrg = (data: unknown) =>
  Schema.decodeUnknown(Org)(data).pipe(
    Effect.mapError(
      (cause) =>
        new BadDataError({
          message: "The org model couldn't be parsed",
          cause,
        })
    )
  )

export const startOrgService = (
  orgSlugPubSub: PubSub.PubSub<
    Take.Take<Either.Either<OrgSlug, NoSelectedOrgError>>
  >,
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
) =>
  Effect.gen(function* () {
    const documentStore = yield* DocumentStore

    yield* orgSlugPubSub.publish(
      // TODO: Replace with last selected org slug from persistent storage
      Take.of(Either.left(new NoSelectedOrgError()))
    )

    const orgPubSubFiber = yield* Effect.forkDaemon(
      Stream.runIntoPubSub(
        pubsubAsPerpetualStream(orgSlugPubSub).pipe(
          Stream.tap((slug) =>
            Effect.sync(() => {
              console.log('Org slug:', slug)
            })
          ),
          StreamEither.flatMap(
            (orgSlug) =>
              documentStore.subscribeTo('orgs', orgSlug).pipe(
                StreamEither.mapLeft((cause) =>
                  cause instanceof NotFoundError
                    ? new NotFoundError<'Org', { orgSlug: OrgSlug }>({
                        resourceType: 'Org',
                        params: { orgSlug },
                      })
                    : cause
                ),
                StreamEither.mapEffect((data) => decodeOrg(data))
              ),
            { switch: true }
          )
        ),
        orgPubSub
      )
    )

    const shutdown = Effect.gen(function* () {
      yield* orgPubSub.shutdown
      yield* orgSlugPubSub.shutdown

      yield* Fiber.joinAll([orgPubSubFiber])
    })

    const service: typeof OrgService.Service = {
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
            Effect.flatMap((chunk) => {
              console.log('Set active org slug to chunk:', chunk)
              return Effect.void
            }),
            Effect.scoped
          )
      },
      orgSlugStream: pubsubAsPerpetualStream(orgSlugPubSub),
      orgSlug: takeOneFromPubSubOrDie(orgSlugPubSub),
      activeOrgStream: pubsubAsPerpetualStream(orgPubSub),
      activeOrg: takeOneFromPubSubOrDie(orgPubSub),
      shutdown,
    }
    return service
  })
