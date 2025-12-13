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
 * Base interface for clinical data repositories that support CRUD operations
 * on FHIR resources. This provides a common structure for repositories
 * managing clinical data in the FHIR store.
 *
 * @template TResource - The resource type (e.g., Questionnaire, Encounter)
 * @template TId - The ID type for the resource (e.g., QuestionnaireId)
 * @template TCreateParams - Optional parameters for create operations
 * @template TGetAllParams - Optional parameters for getAll operations
 */
export interface BaseClinicalDataRepository<
  TResource extends { id?: string | undefined },
  TId extends string,
  TCreateParams = unknown,
  TGetAllParams = unknown,
> {
  /**
   * Retrieve a single resource by ID
   */
  get(
    id: TId
  ): Effect.Effect<
    WithId<TResource>,
    ClinicalDataRepositoryErrorsWithNotFound,
    never
  >

  /**
   * Retrieve all resources matching the given parameters
   */
  getAll(
    params: TGetAllParams
  ): Effect.Effect<WithId<TResource>[], ClinicalDataRepositoryErrors, never>

  /**
   * Create a new resource
   */
  create(
    resource: TResource,
    params?: TCreateParams
  ): Effect.Effect<WithId<TResource>, ClinicalDataRepositoryErrors, never>

  /**
   * Update an existing resource
   */
  update(
    resource: WithId<TResource>
  ): Effect.Effect<
    WithId<TResource>,
    ClinicalDataRepositoryErrorsWithNotFound,
    never
  >

  /**
   * Delete a resource by ID
   */
  delete(
    id: TId
  ): Effect.Effect<object, ClinicalDataRepositoryErrorsWithNotFound, never>
}
