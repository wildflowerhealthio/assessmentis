import type { Effect } from 'effect'
import type { AuthError } from '@assessmentis/ontology'
import type { Resolvers } from './Requests'
import type { BaseResource } from './types'

export interface SourceBehaviour<
  Resources extends {
    [K in string]: BaseResource & { resourceType: K }
  },
  Deps,
> {
  sourceType: string
  sourceId: string
  url: string
  activeResources: Record<keyof Resources, true>
  resolvers: {
    [K in keyof Resources as Resources[K]['resourceType']]: Resolvers<
      Resources[K],
      Deps
    >
  }
  provokeReauth: () => Effect.Effect<void, AuthError, never>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SourceResources<Source extends SourceBehaviour<any, any>> =
  Source extends SourceBehaviour<infer R, infer _D> ? R : never

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SourceDependencies<Source extends SourceBehaviour<any, any>> =
  Source extends SourceBehaviour<infer _R, infer D> ? D : never
