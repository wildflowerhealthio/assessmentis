import { Effect } from 'effect'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { WithId } from '../../data-types/base/Element'
import { Reference } from '../../data-types/complex/IdentifierAndReference'

/**
 * Common error types for clinical data repository operations
 */
export type ClinicalDataRepositoryErrors =
  | UnhandledError
  | NeedsAuthenticationError
  | ExternalAssertionError

export type ClinicalDataRepositoryErrorsWithNotFound =
  | ClinicalDataRepositoryErrors
  | NotFoundError

/**
 * Extract TId and TResource from a BaseClinicalDataRepository
 */
export type ExtractResourceTypes<T> =
  T extends BaseClinicalDataRepository<infer TResource, infer TId>
    ? { resource: TResource; id: TId }
    : never

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

/**
 * Base class for clinical data repositories that support CRUD operations
 * on FHIR resources. This provides a common structure for repositories
 * managing clinical data in the FHIR store.
 *
 * @template TResource - The resource type (e.g., Questionnaire, Encounter)
 * @template TId - The ID type for the resource (e.g., QuestionnaireId)
 * @template TCreateParams - Optional parameters for create operations
 * @template TGetManyParams - Optional parameters for getMany operations
 */
export abstract class BaseClinicalDataRepository<
  TResource extends { id?: TId | undefined },
  TId extends string,
> {
  /**
   * Retrieve a single resource by ID
   */
  abstract get(
    id: TId
  ): Effect.Effect<
    WithId<TResource>,
    ClinicalDataRepositoryErrorsWithNotFound,
    never
  >

  /**
   * Retrieve all resources matching the given parameters
   */
  abstract getMany(params?: {
    [key in Exclude<keyof TResource, 'resourceType'>]?: TResource[key] extends
      | Reference
      | undefined
      ? string
      : TResource[key]
  }): Effect.Effect<WithId<TResource>[], ClinicalDataRepositoryErrors, never>

  /**
   * Create a new resource
   */
  abstract create(
    resource: TResource
  ): Effect.Effect<WithId<TResource>, ClinicalDataRepositoryErrors, never>

  /**
   * Create many new resources
   */
  abstract createMany(
    resources: ReadonlyArray<TResource>
  ): Effect.Effect<
    ReadonlyArray<WithId<TResource>>,
    ClinicalDataRepositoryErrors,
    never
  >

  /**
   * Update an existing resource
   */
  abstract update(
    resource: WithId<TResource>
  ): Effect.Effect<
    WithId<TResource>,
    ClinicalDataRepositoryErrorsWithNotFound,
    never
  >

  /**
   * Delete a resource by ID
   */
  abstract delete(
    id: TId
  ): Effect.Effect<object, ClinicalDataRepositoryErrorsWithNotFound, never>
}
