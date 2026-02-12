import { Effect, Request, Schema } from 'effect'
import { FhirR4Client } from '@assessmentis/fhir-client'
import {
  Schemas,
  ClinicalDataRepositoryErrors,
  ClinicalDataRepositoryErrorsWithNotFound,
  RepositoryFilters,
} from '@assessmentis/clinical-domain'
import { WithId } from '@assessmentis/clinical-domain/data-types'
import {
  GetResource,
  SearchResources,
  CreateResource,
  UpdateResource,
  DeleteResource,
  ClinicalResource,
} from './requests'
import { makeFhirResolvers } from './makeFhirResolvers'

/**
 * Type helper to extract Schema.Type from Schema map
 */
type SchemaType<Key extends keyof typeof Schemas> = Schema.Schema.Type<
  (typeof Schemas)[Key]
>

/**
 * ClinicalStoreService provides typed convenience methods for issuing requests
 * to the clinical data store using Effect Request/RequestResolver system.
 *
 * This service sits alongside ClinicalDataRepositoryService and provides:
 * - Automatic batching (multiple get calls → one batch fetch)
 * - Deduplication (same request in-flight → shared result)
 * - Caching (built into Effect runtime)
 */
export class ClinicalStoreService extends Effect.Service<ClinicalStoreService>()(
  'ClinicalStoreService',
  {
    effect: Effect.gen(function* () {
      const fhirClient = yield* FhirR4Client

      // Create resolvers for each resource type
      const resolvers = {
        Composition: makeFhirResolvers(
          fhirClient,
          'Composition',
          Schemas.Composition
        ),
        Encounter: makeFhirResolvers(fhirClient, 'Encounter', Schemas.Encounter),
        Media: makeFhirResolvers(fhirClient, 'Media', Schemas.Media),
        Observation: makeFhirResolvers(
          fhirClient,
          'Observation',
          Schemas.Observation
        ),
        Patient: makeFhirResolvers(fhirClient, 'Patient', Schemas.Patient),
        Practitioner: makeFhirResolvers(
          fhirClient,
          'Practitioner',
          Schemas.Practitioner
        ),
        Questionnaire: makeFhirResolvers(
          fhirClient,
          'Questionnaire',
          Schemas.Questionnaire
        ),
        QuestionnaireResponse: makeFhirResolvers(
          fhirClient,
          'QuestionnaireResponse',
          Schemas.QuestionnaireResponse
        ),
      } as const

      return { resolvers } as const
    }),
  }
) {
  /**
   * Get a single resource by ID
   */
  get<Key extends keyof typeof Schemas>(
    resourceType: Key,
    id: string
  ): Effect.Effect<
    WithId<SchemaType<Key>>,
    ClinicalDataRepositoryErrorsWithNotFound<SchemaType<Key>>
  > {
    return Effect.gen(function* () {
      const service = yield* ClinicalStoreService
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resolver = (service.resolvers as any)[resourceType].get

      return yield* Effect.request(
        new GetResource({
          resourceType: resourceType as SchemaType<Key>['resourceType'],
          id,
        }),
        resolver
      )
    }).pipe(Effect.provideService(ClinicalStoreService, this)) as Effect.Effect<
      WithId<SchemaType<Key>>,
      ClinicalDataRepositoryErrorsWithNotFound<SchemaType<Key>>
    >
  }

  /**
   * Search for resources matching the given parameters
   */
  search<Key extends keyof typeof Schemas>(
    resourceType: Key,
    params?: RepositoryFilters<SchemaType<Key>>
  ): Effect.Effect<readonly WithId<SchemaType<Key>>[], ClinicalDataRepositoryErrors> {
    return Effect.gen(function* () {
      const service = yield* ClinicalStoreService
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resolver = (service.resolvers as any)[resourceType].search

      return yield* Effect.request(
        new SearchResources({
          resourceType: resourceType as SchemaType<Key>['resourceType'],
          params,
        }),
        resolver
      )
    }).pipe(Effect.provideService(ClinicalStoreService, this)) as Effect.Effect<
      readonly WithId<SchemaType<Key>>[],
      ClinicalDataRepositoryErrors
    >
  }

  /**
   * Create a new resource
   */
  create<Key extends keyof typeof Schemas>(
    resource: SchemaType<Key>
  ): Effect.Effect<WithId<SchemaType<Key>>, ClinicalDataRepositoryErrors> {
    return Effect.gen(function* () {
      const service = yield* ClinicalStoreService
      const resourceType = resource.resourceType as Key
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resolver = (service.resolvers as any)[resourceType].create

      return yield* Effect.request(
        new CreateResource({
          resourceType: resource.resourceType,
          resource,
        }),
        resolver
      )
    }).pipe(Effect.provideService(ClinicalStoreService, this)) as Effect.Effect<
      WithId<SchemaType<Key>>,
      ClinicalDataRepositoryErrors
    >
  }

  /**
   * Update an existing resource
   */
  update<Key extends keyof typeof Schemas>(
    resource: WithId<SchemaType<Key>>
  ): Effect.Effect<
    WithId<SchemaType<Key>>,
    ClinicalDataRepositoryErrorsWithNotFound<SchemaType<Key>>
  > {
    return Effect.gen(function* () {
      const service = yield* ClinicalStoreService
      const resourceType = resource.resourceType as Key
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resolver = (service.resolvers as any)[resourceType].update

      return yield* Effect.request(
        new UpdateResource({
          resourceType: resource.resourceType,
          resource,
        }),
        resolver
      )
    }).pipe(Effect.provideService(ClinicalStoreService, this)) as Effect.Effect<
      WithId<SchemaType<Key>>,
      ClinicalDataRepositoryErrorsWithNotFound<SchemaType<Key>>
    >
  }

  /**
   * Delete a resource by ID
   */
  delete<Key extends keyof typeof Schemas>(
    resourceType: Key,
    id: string
  ): Effect.Effect<
    void,
    ClinicalDataRepositoryErrorsWithNotFound<SchemaType<Key>>
  > {
    return Effect.gen(function* () {
      const service = yield* ClinicalStoreService
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resolver = (service.resolvers as any)[resourceType].delete

      return yield* Effect.request(
        new DeleteResource({
          resourceType: resourceType as SchemaType<Key>['resourceType'],
          id,
        }),
        resolver
      )
    }).pipe(Effect.provideService(ClinicalStoreService, this)) as Effect.Effect<
      void,
      ClinicalDataRepositoryErrorsWithNotFound<SchemaType<Key>>
    >
  }
}
