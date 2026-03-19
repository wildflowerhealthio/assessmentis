import { Context } from 'effect'
import type { Effect } from 'effect'

import type { Bundle } from '@assessmentis/clinical-domain'
import type { AuthError, AuthzError, NotFoundError, UnhandledError } from '@assessmentis/ontology'
import type { DeepReadonly } from '@assessmentis/util'

export interface FhirR4ClientService {
  create: (params: {
    readonly domainType: string
    readonly resource: unknown
  }) => Effect.Effect<unknown, AuthError | AuthzError | UnhandledError>

  read: <ResourceType extends string>(params: {
    readonly domainType: ResourceType
    readonly id: string
  }) => Effect.Effect<
    unknown,
    AuthError | AuthzError | UnhandledError | NotFoundError<ResourceType, { id: string }>
  >

  update: <ResourceType extends string>(params: {
    readonly id: string
    readonly domainType: ResourceType
    readonly resource: unknown
  }) => Effect.Effect<
    unknown,
    AuthError | AuthzError | UnhandledError | NotFoundError<ResourceType, { id: string }>
  >

  delete: <ResourceType extends string>(params: {
    readonly id: string
    readonly domainType: ResourceType
  }) => Effect.Effect<
    void,
    AuthError | AuthzError | UnhandledError | NotFoundError<ResourceType, { id: string }>
  >

  executeBundle: (
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    bundle: DeepReadonly<Bundle<any>>
  ) => Effect.Effect<unknown, AuthError | AuthzError | UnhandledError>

  search: (
    params: {
      readonly domainType: string
    } & Record<string, undefined | string | readonly string[]>
  ) => Effect.Effect<unknown, AuthError | AuthzError | UnhandledError>
}

export const __FhirR4Client: Context.TagClass<FhirR4Client, 'FhirR4Client', FhirR4ClientService> =
  Context.Tag('FhirR4Client')<FhirR4Client, FhirR4ClientService>()

export class FhirR4Client extends __FhirR4Client {}
