/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Context, Effect } from 'effect'
import type {
  AuthError,
  AuthzError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import type { ReadonlyUrl, WithId } from '@assessmentis/effectful-store'
import type { Reference } from './data-types/complex/IdentifierAndReference'
import type ResourceDataTypes from './ResourceDataTypes'

export type ClinicalDomainRepositoryTagClass<
  Key extends keyof ResourceDataTypes,
  Self extends Context.TagClass<
    Self,
    `${ResourceDataTypes[Key]['domainType']}Repository`,
    ClinicalDataRepository<ResourceDataTypes[Key]>
  > = any,
> = Self

/**
 * Common error types for clinical data repository operations
 */
export type ClinicalDataRepositoryErrors =
  | UnhandledError
  | AuthError
  | AuthzError
  | ExternalAssertionError

export type ClinicalDataRepositoryErrorsWithNotFound<
  T extends { domainType: string; url?: string | undefined },
> =
  | ClinicalDataRepositoryErrors
  | NotFoundError<T['domainType'], { url: NonNullable<T['url']> }>

/**
 * Filter type for getMany operations on clinical data repositories.
 * Allows filtering by resource properties, converting Reference types to strings.
 * Reference fields also accept `readonly string[]` for FHIR OR-style searching.
 */
export type RepositoryFilters<TResource> = {
  [key in Exclude<
    keyof TResource,
    'resourceType'
  >]?: Reference extends TResource[key]
    ? undefined | string | readonly string[]
    : TResource[key] extends string
      ? undefined | string | readonly string[]
      : never
}

export interface ClinicalDataRepository<
  T extends { domainType: string; url?: ReadonlyUrl | undefined },
> {
  /**
   * Retrieve a single resource by ID
   */
  get: (
    id: any
  ) => Effect.Effect<any, ClinicalDataRepositoryErrorsWithNotFound<any>, never>

  /**
   * Retrieve all resources matching the given parameters
   */
  getMany: (
    params?: RepositoryFilters<T>
  ) => Effect.Effect<
    ReadonlyArray<WithId<any>>,
    ClinicalDataRepositoryErrors,
    never
  >

  /**
   * Create a new resource
   */
  create: (
    resource: T
  ) => Effect.Effect<WithId<any>, ClinicalDataRepositoryErrors, never>

  /**
   * Create many new resources
   */
  createMany: (
    resources: ReadonlyArray<T>
  ) => Effect.Effect<
    ReadonlyArray<WithId<any>>,
    ClinicalDataRepositoryErrors,
    never
  >

  /**
   * Update an existing resource
   */
  update: (
    resource: any
  ) => Effect.Effect<
    WithId<any>,
    ClinicalDataRepositoryErrorsWithNotFound<any>,
    never
  >

  /**
   * Delete a resource by ID
   */
  delete(
    id: any
  ): Effect.Effect<void, ClinicalDataRepositoryErrorsWithNotFound<any>, never>
}
