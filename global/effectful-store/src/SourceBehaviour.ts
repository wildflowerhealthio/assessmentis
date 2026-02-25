import type { Effect } from 'effect'
import type {
  AuthError,
  AuthzError,
  UnhandledError,
} from '@assessmentis/ontology'
import type { MultiResolver } from './ResourceRequest'
import type * as Resource from './Resource'
import type { StreamEither } from '@assessmentis/util'

export interface SourceBehaviour<
  in out Resources extends {
    readonly [k: PropertyKey]: Resource.Resource<typeof k>
  },
  in ActiveResourceTypes extends keyof Resources,
  out Deps,
> {
  readonly sourceType: string
  readonly sourceId: string
  readonly url: string
  readonly activeResources: {
    readonly [K in keyof Resources]: boolean
  } & {
    readonly [K in ActiveResourceTypes]: true
  }
  readonly resolverStream: StreamEither.StreamEither<
    MultiResolver<Resources, ActiveResourceTypes, Deps>,
    AuthError | AuthzError | UnhandledError
  >
  readonly provokeReauth: () => Effect.Effect<void, AuthError, never>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InferActiveResourceTypes<B extends SourceBehaviour<any, any, any>> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  B extends SourceBehaviour<any, infer Types, any> ? Types : never
