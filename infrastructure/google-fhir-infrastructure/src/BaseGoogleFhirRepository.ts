import { Layer, Effect, Context, Schema } from 'effect'
import {
  Element,
  BaseClinicalDataRepository,
  WithId,
} from '@assessmentis/clinical-domain/general-purpose'
import { BaseConfig } from '@assessmentis/config-domain/googleFhir'
import * as Base from './Base'

/**
 * Base class for Google FHIR repository implementations.
 * Extends BaseClinicalDataRepository and provides concrete implementations
 * for CRUD operations using the Google FHIR Store client.
 *
 * @template TResource - The resource domain type
 * @template TResourceEncoded - The encoded resource type for the schema
 * @template TId - The resource ID type
 *
 * @example
 * ```typescript
 * export class QuestionnaireGoogleFhirRepository extends BaseGoogleFhirRepository<
 *   typeof Questionnaire.Type,
 *   typeof Questionnaire.Encoded,
 *   QuestionnaireId
 * > {
 *   constructor(config: QuestionnaireConfig) {
 *     super('Questionnaire', Questionnaire, config)
 *   }
 * }
 * ```
 */
export abstract class BaseGoogleFhirRepository<
  TResource extends Element<TId>,
  TResourceEncoded extends { resourceType: string; id?: string | undefined },
  TId extends string,
> extends BaseClinicalDataRepository<TResource, TId> {
  protected readonly resourceType: string
  protected readonly schema: Schema.Schema<TResource, TResourceEncoded, never>
  protected readonly config: BaseConfig

  constructor(
    resourceType: string,
    schema: Schema.Schema<TResource, TResourceEncoded, never>,
    config: BaseConfig
  ) {
    super()
    this.resourceType = resourceType
    this.schema = schema
    this.config = config
  }

  // Abstract method implementations from BaseClinicalDataRepository.
  // These methods are not called directly - they exist only to satisfy the abstract class contract.
  // The actual implementations are provided through the createLayer method which properly
  // integrates with the Effect runtime and BaseGoogleFhirStoreClient.
  // Direct calls will throw an error to prevent misuse.
  get(_id: TId): never {
    throw new Error(
      'Method should not be called directly. Use repository via Layer.'
    )
  }

  getMany(_params: unknown): never {
    throw new Error(
      'Method should not be called directly. Use repository via Layer.'
    )
  }

  create(_resource: TResource): never {
    throw new Error(
      'Method should not be called directly. Use repository via Layer.'
    )
  }

  update(_resource: WithId<TResource>): never {
    throw new Error(
      'Method should not be called directly. Use repository via Layer.'
    )
  }

  delete(_id: TId): never {
    throw new Error(
      'Method should not be called directly. Use repository via Layer.'
    )
  }

  /**
   * Create a Layer for this repository with the base FHIR client.
   */
  createLayer<TTag, TService>(
    tag: Context.Tag<TTag, TService>,
    buildService: (operations: {
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
  ): Layer.Layer<TTag, never, never> {
    return Layer.effect(
      tag,
      Effect.gen(
        function* (
          this: BaseGoogleFhirRepository<TResource, TResourceEncoded, TId>
        ) {
          const baseClient = yield* Base.BaseGoogleFhirStoreClient

          const operations = {
            getById: baseClient.getById(this.resourceType, this.schema),
            getAll: baseClient.getAll(this.resourceType, this.schema),
            create: baseClient.create(this.resourceType, this.schema),
            update: baseClient.update(this.resourceType, this.schema),
            deleteById: baseClient.deleteById(this.resourceType, this.schema),
            createWithBundle: baseClient.createWithBundle(this.schema),
          }

          return buildService(operations)
        }.bind(this)
      )
    ).pipe(Layer.provide(Base.LiveClient(this.config)))
  }
}
