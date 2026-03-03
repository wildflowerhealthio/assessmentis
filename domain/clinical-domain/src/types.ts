/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Context, Effect } from 'effect'
import type {
  AuthError,
  AuthzError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import type { ReadonlyUrl, Resource } from '@assessmentis/effectful-store'
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
  T extends {
    readonly domainType: string
    readonly url?: ReadonlyUrl | undefined
  },
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
  T extends {
    readonly domainType: string
    readonly url?: ReadonlyUrl | undefined
  },
> {
  /**
   * Retrieve a single resource by ID
   */
  get: (
    url: ReadonlyUrl
  ) => Effect.Effect<
    Resource.WithResourceUrl<T>,
    ClinicalDataRepositoryErrorsWithNotFound<T>,
    never
  >

  /**
   * Retrieve all resources matching the given parameters
   */
  getMany: (
    params?: RepositoryFilters<T>
  ) => Effect.Effect<
    ReadonlyArray<Resource.WithResourceUrl<T>>,
    ClinicalDataRepositoryErrors,
    never
  >

  /**
   * Create a new resource
   */
  create: (
    resource: T
  ) => Effect.Effect<
    Resource.WithResourceUrl<T>,
    ClinicalDataRepositoryErrors,
    never
  >

  /**
   * Create many new resources
   */
  createMany: (
    resources: ReadonlyArray<T>
  ) => Effect.Effect<
    ReadonlyArray<Resource.WithResourceUrl<T>>,
    ClinicalDataRepositoryErrors,
    never
  >

  /**
   * Update an existing resource
   */
  update: (
    resource: Resource.WithResourceUrl<T>
  ) => Effect.Effect<
    Resource.WithResourceUrl<T>,
    ClinicalDataRepositoryErrorsWithNotFound<T>,
    never
  >

  /**
   * Delete a resource by ID
   */
  delete(
    url: ReadonlyUrl
  ): Effect.Effect<void, ClinicalDataRepositoryErrorsWithNotFound<T>, never>
}
