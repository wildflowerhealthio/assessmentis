import type { Effect } from 'effect'
import { Context } from 'effect'
import type {
  NotFoundError,
  UnhandledError,
  AuthError,
  AuthzError,
} from '@assessmentis/ontology'
import type { OptionalIdBundle } from '@assessmentis/clinical-domain/foundation-framework'
import { type DeepReadonly } from '@assessmentis/util'
import type { ReadonlyRecord } from 'effect/Record'

export class FhirR4Client extends Context.Tag('BareFhirR4Client')<
  FhirR4Client,
  {
    create: (params: {
      readonly type: string
      readonly resource: unknown
    }) => Effect.Effect<unknown, AuthError | AuthzError | UnhandledError, never>

    read: <ResourceType extends string>(params: {
      readonly resourceType: ResourceType
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
      readonly type: ResourceType
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
      readonly type: ResourceType
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
      bundle: DeepReadonly<OptionalIdBundle<any>>
    ) => Effect.Effect<unknown, AuthError | AuthzError | UnhandledError, never>

    search: (
      params: {
        readonly resourceType: string
      } & ReadonlyRecord<string, undefined | string | readonly string[]>
    ) => Effect.Effect<unknown, AuthError | AuthzError | UnhandledError, never>
  }
>() {}
