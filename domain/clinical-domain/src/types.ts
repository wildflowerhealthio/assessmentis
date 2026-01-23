import { Context, Effect } from 'effect'
import {
  AuthError,
  AuthzError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { WithId } from './data-types/base/Element'
import { Reference } from './data-types/complex/IdentifierAndReference'
import Schemas from './Schemas'

export type ClinicalDomainRepositoryTagClass<
  Key extends keyof typeof Schemas,
  Self extends Context.TagClass<
    Self,
    `${Key}Repository`,
    ClinicalDataRepository<(typeof Schemas)[Key]['Type']>
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

export type ClinicalDataRepositoryErrorsWithNotFound =
  | ClinicalDataRepositoryErrors
  | NotFoundError

/**
 * Filter type for getMany operations on clinical data repositories
 * Allows filtering by resource properties, converting Reference types to strings
 */
export type RepositoryFilters<TResource> = {
  [key in Exclude<keyof TResource, 'resourceType'>]?: TResource[key] extends
    | Reference
    | undefined
    ? string
    : TResource[key]
}

export interface ClinicalDataRepository<T extends { id?: string | undefined }> {
  /**
   * Retrieve a single resource by ID
   */
  get: (
    id: NonNullable<T['id']>
  ) => Effect.Effect<WithId<T>, ClinicalDataRepositoryErrorsWithNotFound, never>

  /**
   * Retrieve all resources matching the given parameters
   */
  getMany: (params?: {
    [key in Exclude<keyof T, 'resourceType'>]?: T[key] extends
      | Reference
      | undefined
      ? string
      : T[key]
  }) => Effect.Effect<
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
  ) => Effect.Effect<WithId<T>, ClinicalDataRepositoryErrorsWithNotFound, never>

  /**
   * Delete a resource by ID
   */
  delete(
    id: NonNullable<T['id']>
  ): Effect.Effect<void, ClinicalDataRepositoryErrorsWithNotFound, never>
}
