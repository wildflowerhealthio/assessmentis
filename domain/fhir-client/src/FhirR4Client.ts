import { Context, Effect } from 'effect'
import {
  NotFoundError,
  UnhandledError,
  AuthError,
  AuthzError,
} from '@assessmentis/ontology'
import { Bundle } from '@assessmentis/clinical-domain/foundation-framework'
import { DeepReadonly } from '@assessmentis/util'

export class FhirR4Client extends Context.Tag('BareFhirR4Client')<
  FhirR4Client,
  {
    executeBundle: (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bundle: DeepReadonly<typeof Bundle<any, any>>
    ) => Effect.Effect<unknown, AuthError | AuthzError | UnhandledError, never>
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
    search: (
      params: Record<string, string | undefined> & { resourceType: string }
    ) => Effect.Effect<unknown, AuthError | AuthzError | UnhandledError, never>

    create: (params: {
      type: string
      resource: unknown
    }) => Effect.Effect<unknown, AuthError | AuthzError | UnhandledError, never>

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
  }
>() {}
