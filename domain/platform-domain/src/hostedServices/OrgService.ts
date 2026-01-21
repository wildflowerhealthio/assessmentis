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
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import {
  pubsubAsPerpetualStream,
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
    Either.Either<Org, NoSelectedOrgError | NotFoundError | UnhandledError>
  >
>({
  capacity: 1,
  replay: 1,
})

export class NoSelectedOrgError extends Data.TaggedError(
  'NoSelectedOrgError'
)<object> {}

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
      Either.Either<Org, NoSelectedOrgError | NotFoundError | UnhandledError>,
      never,
      Scope.Scope
    >
    activeOrg: Effect.Effect<
      Org,
      NoSelectedOrgError | NotFoundError | UnhandledError
    >
    shutdown: Effect.Effect<void, never, never>
  }
>() {}

const decodeOrg = (data: unknown) =>
  Schema.decodeUnknown(Org)(data).pipe(
    Effect.mapError(
      (cause) =>
        new UnhandledError({
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
      Either.Either<Org, NoSelectedOrgError | NotFoundError | UnhandledError>
    >
  >
) =>
  Effect.gen(function* () {
    const documentStore = yield* DocumentStore

    yield* orgSlugPubSub.publish(
      // TODO: Replace with last selected org slug from persistent storage
      // Take.of(Either.left(new NoSelectedOrgError({})))
      Take.of(Either.right(OrgSlug.make('localhost')))
    )

    const orgPubSubFiber = yield* Effect.forkDaemon(
      Stream.runIntoPubSub(
        pubsubAsPerpetualStream(orgSlugPubSub).pipe(
          Stream.tap((slug) =>
            Effect.sync(() => {
              console.log('Org slug:', slug)
            })
          ),
          Stream.flatMap(
            (e) =>
              Either.match(e, {
                onRight(
                  orgSlug
                ): Stream.Stream<
                  Either.Either<
                    Org,
                    NoSelectedOrgError | NotFoundError | UnhandledError
                  >
                > {
                  return documentStore.subscribeTo('orgs', orgSlug).pipe(
                    Stream.mapEffect((e) =>
                      Either.match(e, {
                        onRight(
                          data
                        ): Effect.Effect<
                          Either.Either<
                            Org,
                            NoSelectedOrgError | NotFoundError | UnhandledError
                          >
                        > {
                          return Effect.either(decodeOrg(data))
                        },
                        onLeft(
                          err
                        ): Effect.Effect<
                          Either.Either<
                            Org,
                            NoSelectedOrgError | NotFoundError | UnhandledError
                          >
                        > {
                          return Effect.succeed(Either.left(err))
                        },
                      })
                    )
                  )
                },
                onLeft(
                  left
                ): Stream.Stream<
                  Either.Either<
                    Org,
                    NoSelectedOrgError | NotFoundError | UnhandledError
                  >
                > {
                  return Stream.succeed(Either.left(left))
                },
              }),
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
              onNone: () => Take.of(Either.left(new NoSelectedOrgError({}))),
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
