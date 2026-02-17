import type { Context, Utils } from 'effect'
import { Effect, Record, RequestResolver } from 'effect'
import type { NotFoundError } from '@assessmentis/ontology'
import { UnhandledError } from '@assessmentis/ontology'
import type { BaseResource, WithId } from './types'
import type { SourceBehaviour } from './SourceBehaviour'
import {
  constructors as requestConstructors,
  type Constructors,
  type Id,
  type Resolvers,
  type CommonErrors,
  type Get,
} from './Requests'

interface Store<
  Resources extends {
    [K in string]: BaseResource & { resourceType: K }
  },
> {
  get: <T extends Resources[keyof Resources]>(args: {
    resourceType: T['resourceType']
    id: Id<T>
  }) => Effect.Effect<
    WithId<T>,
    CommonErrors | NotFoundError<T['resourceType'], { id: Id<T> }>,
    never
  >
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Identifiers<DependenciesArray extends Array<Context.Tag<any, any>>> = {
  [K in keyof DependenciesArray]: Effect.Effect.Context<DependenciesArray[K]>
}[keyof DependenciesArray]

export const makeStore = <
  Sources extends {
    readonly [K in string]: SourceBehaviour<
      any,
      Identifiers<DependenciesArray>
    > & {
      sourceId: K
    }
  },
  Resources extends {
    readonly [K in string]: BaseResource & {
      resourceType: K
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DependenciesArray extends Array<Context.Tag<any, any>>,
>(
  sources: Sources,
  dependencies: DependenciesArray
): Effect.Effect<Store<Resources>, never, Identifiers<DependenciesArray>> =>
  Effect.gen(function* () {
    yield* Effect.void // TODO - this is here to force the function to be a generator

    const context = yield* Effect.context<Identifiers<DependenciesArray>>()

    const requests = {} as {
      [R in keyof Resources]: Constructors<Resources[R]>
    }

    for (const source of Record.values(sources)) {
      for (const resourceType in source.activeResources as Partial<
        Record<keyof Resources, true>
      >) {
        requests[resourceType] = requestConstructors(resourceType)
      }
    }

    return {
      get: <T extends Resources[keyof Resources]>({
        resourceType,
        id,
      }: {
        resourceType: T['resourceType']
        id: Id<T>
      }): Effect.Effect<
        WithId<T>,
        CommonErrors | NotFoundError<T['resourceType'], { id: Id<T> }>,
        never
      > =>
        // Effect.provide(contextLayer)
        Effect.gen<
          Utils.YieldWrap<
            Effect.Effect<
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              any,
              CommonErrors | NotFoundError<T['resourceType'], { id: Id<T> }>,
              never
            >
          >,
          WithId<T>
        >(function* () {
          const sourceEntries = Record.toEntries(sources)
          const matchingSources = sourceEntries.filter(
            ([_, source]) => source.activeResources[resourceType]
          )

          if (matchingSources.length === 0) {
            return yield* Effect.fail(
              new UnhandledError({
                message: `No sources found for resource type ${resourceType}`,
              })
            )
          }

          if (matchingSources.length > 1) {
            return yield* Effect.fail(
              new UnhandledError({
                message: `Multiple sources found for resource type ${resourceType}, unable to determine which to use`,
              })
            )
          }

          const [_, source] = matchingSources[0]!
          const resolver: Resolvers<
            T,
            {
              [k in keyof DependenciesArray]: Effect.Effect.Context<
                DependenciesArray[k]
              >
            }[keyof DependenciesArray]
          > = source.resolvers[resourceType]

          if (!resolver || !resolver.Get) {
            return yield* Effect.fail(
              new UnhandledError({
                message: `No Get resolver found for resource type ${resourceType} in source ${source.sourceId}`,
              })
            )
          }
          const request = requests[resourceType].Get(id) satisfies Get<
            Resources[T['resourceType']]
          > as Get<T>

          const getResolver = RequestResolver.provideContext(
            resolver.Get,
            context
          )

          return yield* Effect.request(request, getResolver)
        }),
    }
  })
