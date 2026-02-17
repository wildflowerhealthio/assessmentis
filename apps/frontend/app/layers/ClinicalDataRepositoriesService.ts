import type { Layer, Schema, Scope } from 'effect'
import { Effect, Either, pipe, Stream } from 'effect'
import type {
  ClinicalDomainRepositoryTagClass,
  ClinicalDataRepository,
  ResourceDataTypes,
} from '@assessmentis/clinical-domain'
import {
  Composition,
  Questionnaire,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain/content-management'
import {
  Encounter,
  Location,
  Patient,
  Practitioner,
} from '@assessmentis/clinical-domain/administration'
import {
  Media,
  Observation,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import type { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import type { AuthError, UnhandledError } from '@assessmentis/ontology'
import { ExternalAssertionError } from '@assessmentis/ontology'
import { FhirR4ClientService } from './FhirR4ClientService'
import type { NoSelectedOrgError } from '@assessmentis/platform-domain'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeClinicalDataRepository = (..._args: any[]): any => {
  throw new Error('makeClinicalDataRepository is not implemented yet')
}

export type GoogleFhirWebLayer<Key extends keyof ResourceDataTypes> =
  Layer.Layer<
    ClinicalDomainRepositoryTagClass<Key>,
    ExternalAssertionError,
    LoadedGoogleFhirConfig
  >

export type ClinicalDataRepositoryServiceType = {
  effect: {
    [Key in keyof ResourceDataTypes]: Effect.Effect<
      ClinicalDataRepository<ResourceDataTypes[Key]>,
      AuthError | NoSelectedOrgError | UnhandledError
    >
  }

  stream: {
    [Key in keyof ResourceDataTypes]: Stream.Stream<
      Either.Either<
        ClinicalDataRepository<ResourceDataTypes[Key]>,
        AuthError | NoSelectedOrgError | UnhandledError
      >,
      never,
      Scope.Scope
    >
  }
}

export class ClinicalDataRepositoryService extends Effect.Service<ClinicalDataRepositoryService>()(
  'ClinicalDataRepositoryService',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      const clientService = yield* FhirR4ClientService

      const clientEffect = <
        const ResourceType extends string,
        A extends { id?: string | undefined; resourceType: ResourceType },
        I extends { id?: string | undefined; resourceType: ResourceType },
      >(
        schema: Schema.Schema<A, I, never>,
        resourceType: ResourceType
      ): Effect.Effect<
        ClinicalDataRepository<A>,
        AuthError | NoSelectedOrgError | UnhandledError,
        never
      > =>
        Effect.map(clientService.client, (fhirClient) =>
          makeClinicalDataRepository(fhirClient, resourceType, schema)
        ).pipe(
          Effect.mapError((e) =>
            e instanceof ExternalAssertionError ? e.asUnhandledError() : e
          )
        )

      const clientStream = <
        const ResourceType extends string,
        A extends { id?: string | undefined; resourceType: ResourceType },
        I extends { id?: string | undefined; resourceType: ResourceType },
      >(
        schema: Schema.Schema<A, I, never>,
        resourceType: ResourceType
      ): Stream.Stream<
        Either.Either<
          ClinicalDataRepository<A>,
          AuthError | NoSelectedOrgError | UnhandledError
        >,
        never,
        Scope.Scope
      > =>
        Stream.map(
          clientService.clientStream,
          Either.map((fhirClient) =>
            makeClinicalDataRepository(fhirClient, resourceType, schema)
          )
        ).pipe(
          Stream.map(
            Either.mapLeft((e) =>
              e instanceof ExternalAssertionError ? e.asUnhandledError() : e
            )
          )
        )

      const effect: ClinicalDataRepositoryServiceType['effect'] = {
        Composition: clientEffect(Composition.Schema, 'Composition'),
        Encounter: clientEffect(Encounter.Schema, 'Encounter'),
        Location: clientEffect(Location.Schema, 'Location'),
        Media: clientEffect(Media.Schema, 'Media'),
        Observation: clientEffect(Observation.Schema, 'Observation'),
        Patient: clientEffect(Patient.Schema, 'Patient'),
        Practitioner: clientEffect(Practitioner.Schema, 'Practitioner'),
        Questionnaire: clientEffect(Questionnaire.Schema, 'Questionnaire'),
        QuestionnaireResponse: clientEffect(
          QuestionnaireResponse.Schema,
          'QuestionnaireResponse'
        ),
      }

      const stream: ClinicalDataRepositoryServiceType['stream'] = {
        Composition: clientStream(Composition.Schema, 'Composition'),
        Encounter: clientStream(Encounter.Schema, 'Encounter'),
        Location: clientStream(Location.Schema, 'Location'),
        Media: clientStream(Media.Schema, 'Media'),
        Observation: clientStream(Observation.Schema, 'Observation'),
        Patient: clientStream(Patient.Schema, 'Patient'),
        Practitioner: clientStream(Practitioner.Schema, 'Practitioner'),
        Questionnaire: clientStream(Questionnaire.Schema, 'Questionnaire'),
        QuestionnaireResponse: clientStream(
          QuestionnaireResponse.Schema,
          'QuestionnaireResponse'
        ),
      }

      return {
        effect,
        stream,
      }
    }),
  }
) {
  repositoryEffect<TResourceType extends keyof ResourceDataTypes>(
    resourceType: TResourceType
  ): Effect.Effect<
    ClinicalDataRepository<ResourceDataTypes[TResourceType]>,
    AuthError | NoSelectedOrgError | UnhandledError,
    never
  > {
    return pipe(
      ClinicalDataRepositoryService,
      Effect.flatMap(
        (service) =>
          service.effect[resourceType] as unknown as Effect.Effect<
            ClinicalDataRepository<ResourceDataTypes[TResourceType]>,
            AuthError | NoSelectedOrgError | UnhandledError,
            never
          >
      ),
      Effect.provideService(ClinicalDataRepositoryService, this)
    )
  }

  repositoryStream<
    TResource extends ResourceDataTypes[keyof ResourceDataTypes],
  >(
    resourceType: TResource['resourceType']
  ): Stream.Stream<
    Either.Either<
      ClinicalDataRepository<TResource>,
      AuthError | NoSelectedOrgError | UnhandledError
    >,
    never,
    Scope.Scope
  > {
    return pipe(
      Effect.map(
        ClinicalDataRepositoryService,
        (service) =>
          service.stream[resourceType] as unknown as Stream.Stream<
            Either.Either<
              ClinicalDataRepository<TResource>,
              AuthError | NoSelectedOrgError | UnhandledError
            >,
            never,
            Scope.Scope
          >
      ),
      Effect.provideService(ClinicalDataRepositoryService, this),
      Stream.unwrap
    )
  }
}
