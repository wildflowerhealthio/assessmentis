import { Layer, Effect, Context, Schema } from 'effect'
import { Element } from '@assessmentis/clinical-domain/general-purpose'
import { BaseConfig } from '@assessmentis/config-domain/googleFhir'
import * as Base from './Base'

/**
 * Creates a standard FHIR repository layer with CRUD operations.
 * This utility reduces code duplication across repository implementations
 * by providing a common pattern for creating repository layers.
 *
 * @template TTag - The repository Context.Tag
 * @template TResource - The resource domain type
 * @template TResourceEncoded - The encoded resource type for the schema
 * @template TId - The resource ID type
 *
 * @param tag - The Context.Tag for dependency injection
 * @param resourceType - The FHIR resource type name (e.g., 'Questionnaire')
 * @param schema - The Effect Schema for encoding/decoding the resource
 * @param config - The Google FHIR store configuration
 * @param buildMethods - Function to build repository-specific methods from base operations
 *
 * @returns A Layer providing the repository implementation
 *
 * @example
 * ```typescript
 * export const Repository = (config: QuestionnaireConfig) =>
 *   createStandardRepository(
 *     QuestionnaireRepository,
 *     'Questionnaire',
 *     Questionnaire,
 *     config,
 *     ({ getById, getAll, create, deleteById }) => ({
 *       getQuestionnaire: getById,
 *       getQuestionnaires: getAll,
 *       createQuestionnaire: create,
 *       deleteQuestionnaire: deleteById,
 *     })
 *   )
 * ```
 */
export const createStandardRepository = <
  TTag,
  TResource extends Element<TId>,
  TResourceEncoded extends { resourceType: string; id?: string | undefined },
  TId extends string,
  TService,
>(
  tag: Context.Tag<TTag, TService>,
  resourceType: string,
  schema: Schema.Schema<TResource, TResourceEncoded, never>,
  config: BaseConfig,
  buildMethods: (operations: {
    getById: ReturnType<
      typeof Base.BaseGoogleFhirStoreClient.Service.getById<
        TId,
        TResource,
        TResourceEncoded
      >
    >
    getAll: ReturnType<
      typeof Base.BaseGoogleFhirStoreClient.Service.getAll<
        TResource,
        TResourceEncoded
      >
    >
    create: ReturnType<
      typeof Base.BaseGoogleFhirStoreClient.Service.create<
        TResource,
        TResourceEncoded
      >
    >
    update: ReturnType<
      typeof Base.BaseGoogleFhirStoreClient.Service.update<
        TResource,
        TResourceEncoded
      >
    >
    deleteById: ReturnType<
      typeof Base.BaseGoogleFhirStoreClient.Service.deleteById<
        TId,
        TResource,
        TResourceEncoded
      >
    >
    createWithBundle: ReturnType<
      typeof Base.BaseGoogleFhirStoreClient.Service.createWithBundle<
        TResource,
        TResourceEncoded
      >
    >
  }) => TService
): Layer.Layer<TTag, never, never> =>
  Layer.effect(
    tag,
    Effect.gen(function* () {
      const baseClient = yield* Base.BaseGoogleFhirStoreClient

      const operations = {
        getById: baseClient.getById(resourceType, schema),
        getAll: baseClient.getAll(resourceType, schema),
        create: baseClient.create(resourceType, schema),
        update: baseClient.update(resourceType, schema),
        deleteById: baseClient.deleteById(resourceType, schema),
        createWithBundle: baseClient.createWithBundle(schema),
      }

      return buildMethods(operations)
    })
  ).pipe(Layer.provide(Base.LiveClient(config)))
