import { Effect } from 'effect'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '../errors'
import { WithId } from './Element'

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
  abstract getMany(
    params: TResource
  ): Effect.Effect<WithId<TResource>[], ClinicalDataRepositoryErrors, never>

  /**
   * Create a new resource
   */
  abstract create(
    resource: TResource
  ): Effect.Effect<WithId<TResource>, ClinicalDataRepositoryErrors, never>

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
