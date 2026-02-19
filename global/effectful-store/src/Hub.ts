import { Array, type Context } from 'effect'
import { Effect, Record, RequestResolver, Request } from 'effect'
import type {
  AuthError,
  AuthzError,
  NotFoundError,
} from '@assessmentis/ontology'
import { UnhandledError } from '@assessmentis/ontology'
import type { BaseResource, WithId, Id } from './types'
import type {
  InferActiveResourceTypes,
  SourceBehaviour,
} from './SourceBehaviour'
import type * as ResourceRequest from './ResourceRequest'
import { StreamEither } from '@assessmentis/util'
import { NoSuchElementExceptionTypeId } from 'effect/Cause'

export interface Hub<
  Resources extends {
    readonly [K: string]: BaseResource & { readonly resourceType: typeof K }
  },
> {
  get: <K extends keyof Resources & string>(args: {
    resourceType: K
    id: Id<Resources[K]>
  }) => Effect.Effect<
    WithId<Resources[K]>,
    | ResourceRequest.CommonErrors
    | NotFoundError<Resources[K]['resourceType'], { id: Id<Resources[K]> }>,
    never
  >

  search: <K extends keyof Resources & string>(args: {
    resourceType: K
    params: ResourceRequest.SearchParam<Resources[K]>
  }) => Effect.Effect<
    ReadonlyArray<WithId<Resources[K]>>,
    ResourceRequest.CommonErrors,
    never
  >

  create: <K extends keyof Resources & string>(args: {
    resourceType: K
    resource: Resources[K]
  }) => Effect.Effect<WithId<Resources[K]>, ResourceRequest.CommonErrors, never>

  update: <K extends keyof Resources & string>(args: {
    resourceType: K
    resource: WithId<Resources[K]>
  }) => Effect.Effect<
    WithId<Resources[K]>,
    | ResourceRequest.CommonErrors
    | NotFoundError<Resources[K]['resourceType'], { id: Id<Resources[K]> }>,
    never
  >

  delete: <K extends keyof Resources & string>(args: {
    resourceType: K
    id: Id<Resources[K]>
  }) => Effect.Effect<
    void,
    | ResourceRequest.CommonErrors
    | NotFoundError<Resources[K]['resourceType'], { id: Id<Resources[K]> }>,
    never
  >
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Identifiers<DependenciesArray extends Array<Context.Tag<any, any>>> = {
  [K in keyof DependenciesArray]: Effect.Effect.Context<DependenciesArray[K]>
}[keyof DependenciesArray]

export const make = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DependenciesArray extends Array<Context.Tag<any, any>>,
  Resources extends {
    readonly [key: string]: BaseResource & {
      readonly resourceType: typeof key
    }
  },
  SourceResources extends {
    readonly [SourceId: string]: keyof Resources & string
  },
  Sources extends {
    readonly [SourceId in keyof SourceResources]: SourceBehaviour<
      Resources,
      SourceResources[SourceId],
      Identifiers<DependenciesArray>
    >
  },
>(
  sources: Sources
): Effect.Effect<Hub<Resources>, never, Identifiers<DependenciesArray>> =>
  Effect.gen(function* () {
    yield* Effect.void // TODO - this is here to force the function to be a generator

    const context = yield* Effect.context<Identifiers<DependenciesArray>>()

    return {
      sourceFor<K extends keyof Resources & string>(
        resourceType: K
      ): Effect.Effect<
        SourceBehaviour<Resources, K, Identifiers<DependenciesArray>>,
        UnhandledError,
        never
      > {
        return Effect.gen(this, function* () {
          const sourceEntries = Record.toEntries(sources)
          const matchingSources = sourceEntries.filter(
            (
              sourcePair
            ): sourcePair is [
              string,
              SourceBehaviour<
                Resources,
                K | InferActiveResourceTypes<(typeof sourcePair)[1]>,
                Identifiers<DependenciesArray>
              >,
            ] => {
              const source = sourcePair[1]
              return !!(
                resourceType in source.activeResources &&
                source.activeResources[resourceType]
              )
            }
          )

          if (matchingSources.length > 1) {
            return yield* Effect.fail(
              new UnhandledError({
                message: `Multiple sources found for resource type ${resourceType}, unable to determine which to use`,
              })
            )
          }

          if (!Array.isNonEmptyArray(matchingSources)) {
            return yield* Effect.fail(
              new UnhandledError({
                message: `No sources found for resource type ${resourceType}`,
              })
            )
          }

          const source: SourceBehaviour<
            Resources,
            K,
            Identifiers<DependenciesArray>
          > = matchingSources[0][1]
          return source
        })
      },

      takeResolver<K extends keyof Resources & string>(
        source: SourceBehaviour<Resources, K, Identifiers<DependenciesArray>>
      ) {
        return Effect.gen(this, function* () {
          const resolverStream: StreamEither.StreamEither<
            ResourceRequest.MultiResolver<
              Resources,
              K,
              Identifiers<DependenciesArray>
            >,
            UnhandledError | AuthError | AuthzError
          > = source.resolverStream

          const resolver: ResourceRequest.MultiResolver<
            Resources,
            K,
            Identifiers<DependenciesArray>
          > = yield* StreamEither.head(resolverStream).pipe(
            Effect.catchIf(
              (err) => NoSuchElementExceptionTypeId in err,
              (err) =>
                Effect.fail(
                  new UnhandledError({
                    message: `No resolvers found for source ${source.sourceId}`,
                    cause: err,
                  })
                )
            )
          )

          return resolver
        })
      },

      get<K extends keyof Resources & string>({
        resourceType,
        id,
      }: {
        resourceType: K
        id: Id<Resources[K]>
      }): Effect.Effect<
        WithId<Resources[K]>,
        | ResourceRequest.CommonErrors
        | NotFoundError<Resources[K]['resourceType'], { id: Id<Resources[K]> }>,
        never
      > {
        return Effect.gen(this, function* () {
          const source = yield* this.sourceFor(resourceType)
          const resolver = yield* this.takeResolver(source)

          const getRequest = Request.of<ResourceRequest.Get<Resources[K]>>()({
            _tag: 'Get',
            resourceType,
            id,
          })

          const thisResolver = RequestResolver.provideContext(resolver, context)

          return yield* Effect.request(getRequest, thisResolver)
        })
      },

      search<K extends keyof Resources & string>({
        resourceType,
        params,
      }: {
        resourceType: K
        params: ResourceRequest.SearchParam<Resources[K]>
      }): Effect.Effect<
        ReadonlyArray<WithId<Resources[K]>>,
        ResourceRequest.CommonErrors,
        never
      > {
        return Effect.gen(this, function* () {
          const source = yield* this.sourceFor(resourceType)
          const resolver = yield* this.takeResolver(source)

          const searchRequest = Request.of<
            ResourceRequest.Search<Resources[K]>
          >()({
            _tag: 'Search',
            resourceType,
            params,
          })

          const thisResolver = RequestResolver.provideContext(resolver, context)

          return yield* Effect.request(searchRequest, thisResolver)
        })
      },

      create<K extends keyof Resources & string>({
        resourceType,
        resource,
      }: {
        resourceType: K
        resource: Resources[K]
      }): Effect.Effect<
        WithId<Resources[K]>,
        ResourceRequest.CommonErrors,
        never
      > {
        return Effect.gen(this, function* () {
          const source = yield* this.sourceFor(resourceType)
          const resolver = yield* this.takeResolver(source)

          const createRequest = Request.of<
            ResourceRequest.Create<Resources[K]>
          >()({
            _tag: 'Create',
            resourceType,
            resource,
          })

          const thisResolver = RequestResolver.provideContext(resolver, context)

          return yield* Effect.request(createRequest, thisResolver)
        })
      },

      update<K extends keyof Resources & string>({
        resourceType,
        resource,
      }: {
        resourceType: K
        resource: WithId<Resources[K]>
      }): Effect.Effect<
        WithId<Resources[K]>,
        | ResourceRequest.CommonErrors
        | NotFoundError<Resources[K]['resourceType'], { id: Id<Resources[K]> }>,
        never
      > {
        return Effect.gen(this, function* () {
          const source = yield* this.sourceFor(resourceType)
          const resolver = yield* this.takeResolver(source)

          const updateRequest = Request.of<
            ResourceRequest.Update<Resources[K]>
          >()({
            _tag: 'Update',
            resourceType,
            resource,
          })

          const thisResolver = RequestResolver.provideContext(resolver, context)

          return yield* Effect.request(updateRequest, thisResolver)
        })
      },

      delete<K extends keyof Resources & string>({
        resourceType,
        id,
      }: {
        resourceType: K
        id: Id<Resources[K]>
      }): Effect.Effect<
        void,
        | ResourceRequest.CommonErrors
        | NotFoundError<Resources[K]['resourceType'], { id: Id<Resources[K]> }>,
        never
      > {
        return Effect.gen(this, function* () {
          const source = yield* this.sourceFor(resourceType)
          const resolver = yield* this.takeResolver(source)

          const deleteRequest = Request.of<
            ResourceRequest.Delete<Resources[K]>
          >()({
            _tag: 'Delete',
            resourceType,
            id,
          })

          const thisResolver = RequestResolver.provideContext(resolver, context)

          return yield* Effect.request(deleteRequest, thisResolver)
        })
      },
    }
  })
