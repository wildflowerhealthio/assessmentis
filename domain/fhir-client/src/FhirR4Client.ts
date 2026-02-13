import type { Effect } from 'effect'
import { Context } from 'effect'
import type {
  NotFoundError,
  UnhandledError,
  AuthError,
  AuthzError,
} from '@assessmentis/ontology'
import type { Bundle } from '@assessmentis/clinical-domain/foundation-framework'
import { type DeepReadonly } from '@assessmentis/util'

export class FhirR4Client extends Context.Tag('BareFhirR4Client')<
  FhirR4Client,
  {
    create: (params: {
      type: string
      resource: unknown
    }) => Effect.Effect<unknown, AuthError | AuthzError | UnhandledError, never>

    read: <ResourceType extends string>(params: {
      resourceType: ResourceType
      id: string
    }) => Effect.Effect<
      unknown,
      | AuthError
      | AuthzError
      | UnhandledError
      | NotFoundError<ResourceType, { id: string }>,
      never
    >

    update: <ResourceType extends string>(params: {
      id: string
      type: ResourceType
      resource: unknown
    }) => Effect.Effect<
      unknown,
      | AuthError
      | AuthzError
      | UnhandledError
      | NotFoundError<ResourceType, { id: string }>,
      never
    >

    delete: <ResourceType extends string>(params: {
      id: string
      type: ResourceType
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
      params: Record<string, string | readonly string[] | undefined> & {
        resourceType: string
      }
    ) => Effect.Effect<unknown, AuthError | AuthzError | UnhandledError, never>
  }
>() {}
