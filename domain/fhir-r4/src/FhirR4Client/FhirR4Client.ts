import { Context, type Effect } from 'effect'

import type { Bundle } from '@assessmentis/clinical-domain'
import type {
  AuthError,
  AuthzError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { type DeepReadonly } from '@assessmentis/util'

export class FhirR4Client extends Context.Tag('FhirR4Client')<
  FhirR4Client,
  {
    create: (params: {
      readonly domainType: string
      readonly resource: unknown
    }) => Effect.Effect<unknown, AuthError | AuthzError | UnhandledError, never>

    read: <ResourceType extends string>(params: {
      readonly domainType: ResourceType
      readonly id: string
    }) => Effect.Effect<
      unknown,
      | AuthError
      | AuthzError
      | UnhandledError
      | NotFoundError<ResourceType, { id: string }>,
      never
    >

    update: <ResourceType extends string>(params: {
      readonly id: string
      readonly domainType: ResourceType
      readonly resource: unknown
    }) => Effect.Effect<
      unknown,
      | AuthError
      | AuthzError
      | UnhandledError
      | NotFoundError<ResourceType, { id: string }>,
      never
    >

    delete: <ResourceType extends string>(params: {
      readonly id: string
      readonly domainType: ResourceType
    }) => Effect.Effect<
      void,
      | AuthError
      | AuthzError
      | UnhandledError
      | NotFoundError<ResourceType, { id: string }>,
      never
    >

    executeBundle: (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bundle: DeepReadonly<Bundle<any>>
    ) => Effect.Effect<unknown, AuthError | AuthzError | UnhandledError, never>

    search: (
      params: {
        readonly domainType: string
      } & Record<string, undefined | string | ReadonlyArray<string>>
    ) => Effect.Effect<unknown, AuthError | AuthzError | UnhandledError, never>
  }
>() {}
