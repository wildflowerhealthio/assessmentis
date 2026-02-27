import { Array, type Context } from 'effect'
import { Effect, Record, RequestResolver, Request } from 'effect'
import type {
  AuthError,
  AuthzError,
  NotFoundError,
} from '@assessmentis/ontology'
import { UnhandledError } from '@assessmentis/ontology'
import type * as Resource from './Resource'
import type {
  InferActiveResourceTypes,
  SourceBehaviour,
} from './SourceBehaviour'
import type * as ResourceRequest from './ResourceRequest'
import { StreamEither } from '@assessmentis/util'
import { NoSuchElementExceptionTypeId } from 'effect/Cause'

export interface Hub<
  Resources extends {
    readonly [K: PropertyKey]: Resource.Resource<typeof K>
  },
> {
  get: <K extends keyof Resources>(args: {
    domainType: K
    url: Resource.InferResourceUrl<Resources[K]>
  }) => Effect.Effect<
    Resource.WithResourceUrl<Resources[K]>,
    | ResourceRequest.CommonErrors
    | NotFoundError<
        Resources[K]['domainType'],
        { url: Resource.InferResourceUrl<Resources[K]> }
      >,
    never
  >

  search: <K extends keyof Resources>(args: {
    domainType: K
    params: ResourceRequest.SearchParam<Resources[K]>
  }) => Effect.Effect<
    ReadonlyArray<Resource.WithResourceUrl<Resources[K]>>,
    ResourceRequest.CommonErrors,
    never
  >

  create: <K extends keyof Resources>(args: {
    domainType: K
    resource: Resources[K]
  }) => Effect.Effect<
    Resource.WithResourceUrl<Resources[K]>,
    ResourceRequest.CommonErrors,
    never
  >

  update: <K extends keyof Resources>(args: {
    domainType: K
    resource: Resource.WithResourceUrl<Resources[K]>
  }) => Effect.Effect<
    Resource.WithResourceUrl<Resources[K]>,
    | ResourceRequest.CommonErrors
    | NotFoundError<
        Resources[K]['domainType'],
        { url: Resource.InferResourceUrl<Resources[K]> }
      >,
    never
  >

  delete: <K extends keyof Resources>(args: {
    domainType: K
    url: Resource.InferResourceUrl<Resources[K]>
  }) => Effect.Effect<
    void,
    | ResourceRequest.CommonErrors
    | NotFoundError<
        Resources[K]['domainType'],
        { url: Resource.InferResourceUrl<Resources[K]> }
      >,
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
  TResources extends {
    readonly [key: PropertyKey]: Resource.Resource<typeof key>
  },
  TSourceResources extends {
    readonly [SourceUrl: string]: keyof TResources & string
  },
  TSources extends {
    readonly [SourceId in keyof TSourceResources]: SourceBehaviour<
      TResources,
      TSourceResources[SourceId],
      Identifiers<DependenciesArray>
    >
  },
>(
  sources: TSources
): Effect.Effect<Hub<TResources>, never, Identifiers<DependenciesArray>> =>
  Effect.gen(function* () {
    yield* Effect.void // TODO - this is here to force the function to be a generator

    const context = yield* Effect.context<Identifiers<DependenciesArray>>()

    return {
      sourceFor<K extends keyof TResources>(
        domainType: K
      ): Effect.Effect<
        SourceBehaviour<TResources, K, Identifiers<DependenciesArray>>,
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
                TResources,
                K | InferActiveResourceTypes<(typeof sourcePair)[1]>,
                Identifiers<DependenciesArray>
              >,
            ] => {
              const source = sourcePair[1]
              return !!(
                domainType in source.activeResources &&
                source.activeResources[domainType]
              )
            }
          )

          if (matchingSources.length > 1) {
            return yield* Effect.fail(
              new UnhandledError({
                message: `Multiple sources found for resource type ${String(domainType)}, unable to determine which to use`,
              })
            )
          }

          if (!Array.isNonEmptyArray(matchingSources)) {
            return yield* Effect.fail(
              new UnhandledError({
                message: `No sources found for resource type ${String(domainType)}`,
              })
            )
          }

          const source: SourceBehaviour<
            TResources,
            K,
            Identifiers<DependenciesArray>
          > = matchingSources[0][1]
          return source
        })
      },

      takeResolver<K extends keyof TResources>(
        source: SourceBehaviour<TResources, K, Identifiers<DependenciesArray>>
      ): Effect.Effect<
        ResourceRequest.MultiResolver<
          TResources,
          K,
          Identifiers<DependenciesArray>
        >,
        UnhandledError | AuthError | AuthzError,
        never
      > {
        return Effect.gen(this, function* () {
          const resolverStream: StreamEither.StreamEither<
            ResourceRequest.MultiResolver<
              TResources,
              K,
              Identifiers<DependenciesArray>
            >,
            UnhandledError | AuthError | AuthzError
          > = source.resolverStream

          const resolver: ResourceRequest.MultiResolver<
            TResources,
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

      get<K extends keyof TResources>({
        domainType,
        url,
      }: {
        domainType: K
        url: Resource.InferResourceUrl<TResources[K]>
      }): Effect.Effect<
        Resource.WithResourceUrl<TResources[K]>,
        | ResourceRequest.CommonErrors
        | NotFoundError<
            TResources[K]['domainType'],
            { url: Resource.InferResourceUrl<TResources[K]> }
          >,
        never
      > {
        return Effect.gen(this, function* () {
          const source = yield* this.sourceFor(domainType)
          const resolver = yield* this.takeResolver(source)

          const getRequest = Request.of<ResourceRequest.Get<TResources[K]>>()({
            _tag: 'Get',
            domainType,
            url,
          })

          const thisResolver = RequestResolver.provideContext(resolver, context)

          return yield* Effect.request(getRequest, thisResolver)
        })
      },

      search<K extends keyof TResources>({
        domainType,
        params,
      }: {
        domainType: K
        params: ResourceRequest.SearchParam<TResources[K]>
      }): Effect.Effect<
        ReadonlyArray<Resource.WithResourceUrl<TResources[K]>>,
        ResourceRequest.CommonErrors,
        never
      > {
        return Effect.gen(this, function* () {
          const source = yield* this.sourceFor(domainType)
          const resolver = yield* this.takeResolver(source)

          const searchRequest = Request.of<
            ResourceRequest.Search<TResources[K]>
          >()({
            _tag: 'Search',
            domainType,
            params,
          })

          const thisResolver = RequestResolver.provideContext(resolver, context)

          return yield* Effect.request(searchRequest, thisResolver)
        })
      },

      create<K extends keyof TResources>({
        domainType,
        resource,
      }: {
        domainType: K
        resource: TResources[K]
      }): Effect.Effect<
        Resource.WithResourceUrl<TResources[K]>,
        ResourceRequest.CommonErrors,
        never
      > {
        return Effect.gen(this, function* () {
          const source = yield* this.sourceFor(domainType)
          const resolver = yield* this.takeResolver(source)

          const createRequest = Request.of<
            ResourceRequest.Create<TResources[K]>
          >()({
            _tag: 'Create',
            domainType,
            resource,
          })

          const thisResolver = RequestResolver.provideContext(resolver, context)

          return yield* Effect.request(createRequest, thisResolver)
        })
      },

      update<K extends keyof TResources>({
        domainType,
        resource,
      }: {
        domainType: K
        resource: Resource.WithResourceUrl<TResources[K]>
      }): Effect.Effect<
        Resource.WithResourceUrl<TResources[K]>,
        | ResourceRequest.CommonErrors
        | NotFoundError<
            TResources[K]['domainType'],
            { url: Resource.InferResourceUrl<TResources[K]> }
          >,
        never
      > {
        return Effect.gen(this, function* () {
          const source = yield* this.sourceFor(domainType)
          const resolver = yield* this.takeResolver(source)

          const updateRequest = Request.of<
            ResourceRequest.Update<TResources[K]>
          >()({
            _tag: 'Update',
            domainType,
            resource,
          })

          const thisResolver = RequestResolver.provideContext(resolver, context)

          return yield* Effect.request(updateRequest, thisResolver)
        })
      },

      delete<K extends keyof TResources>({
        domainType,
        url,
      }: {
        domainType: K
        url: Resource.InferResourceUrl<TResources[K]>
      }): Effect.Effect<
        void,
        | ResourceRequest.CommonErrors
        | NotFoundError<
            TResources[K]['domainType'],
            { url: Resource.InferResourceUrl<TResources[K]> }
          >,
        never
      > {
        return Effect.gen(this, function* () {
          const source = yield* this.sourceFor(domainType)
          const resolver = yield* this.takeResolver(source)

          const deleteRequest = Request.of<
            ResourceRequest.Delete<TResources[K]>
          >()({
            _tag: 'Delete',
            domainType,
            url,
          })

          const thisResolver = RequestResolver.provideContext(resolver, context)

          return yield* Effect.request(deleteRequest, thisResolver)
        })
      },
    }
  })
