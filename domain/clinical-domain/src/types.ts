import type { Context, Effect } from 'effect'
import type {
  AuthError,
  AuthzError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import type { WithId } from '@assessmentis/effectful-store'
import type { Reference } from './data-types/complex/IdentifierAndReference'
import type ResourceDataTypes from './ResourceDataTypes'

export type ClinicalDomainRepositoryTagClass<
  Key extends keyof ResourceDataTypes,
  Self extends Context.TagClass<
    Self,
    `${ResourceDataTypes[Key]['resourceType']}Repository`,
    ClinicalDataRepository<ResourceDataTypes[Key]>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  T extends { resourceType: string; id?: string | undefined },
> =
  | ClinicalDataRepositoryErrors
  | NotFoundError<T['resourceType'], { id: NonNullable<T['id']> }>

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
  T extends { resourceType: string; id?: string | undefined },
> {
  /**
   * Retrieve a single resource by ID
   */
  get: (
    id: NonNullable<T['id']>
  ) => Effect.Effect<
    WithId<T>,
    ClinicalDataRepositoryErrorsWithNotFound<T>,
    never
  >

  /**
   * Retrieve all resources matching the given parameters
   */
  getMany: (
    params?: RepositoryFilters<T>
  ) => Effect.Effect<
    ReadonlyArray<WithId<T>>,
    ClinicalDataRepositoryErrors,
    never
  >

  /**
   * Create a new resource
   */
  create: (
    resource: T
  ) => Effect.Effect<WithId<T>, ClinicalDataRepositoryErrors, never>

  /**
   * Create many new resources
   */
  createMany: (
    resources: ReadonlyArray<T>
  ) => Effect.Effect<
    ReadonlyArray<WithId<T>>,
    ClinicalDataRepositoryErrors,
    never
  >

  /**
   * Update an existing resource
   */
  update: (
    resource: WithId<T>
  ) => Effect.Effect<
    WithId<T>,
    ClinicalDataRepositoryErrorsWithNotFound<T>,
    never
  >

  /**
   * Delete a resource by ID
   */
  delete(
    id: NonNullable<T['id']>
  ): Effect.Effect<void, ClinicalDataRepositoryErrorsWithNotFound<T>, never>
}
