import type { Layer, Schema, Scope } from 'effect'
import { Effect, Either, pipe, Stream } from 'effect'
import type {
  ClinicalDomainRepositoryTagClass,
  ClinicalDataRepository,
  ResourceDataTypes,
} from '@assessmentis/clinical-domain'
import {
  CompositionFromFhirR4,
  QuestionnaireFromFhirR4,
  QuestionnaireResponseFromFhirR4,
} from '@assessmentis/clinical-domain/content-management'
import {
  EncounterFromFhirR4,
  LocationFromFhirR4,
  PatientFromFhirR4,
  PractitionerFromFhirR4,
} from '@assessmentis/clinical-domain/administration'
import {
  MediaFromFhirR4,
  ObservationFromFhirR4,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { makeClinicalDataRepository } from '@assessmentis/clinical-domain/assessmentis'
import type { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import type { AuthError, UnhandledError } from '@assessmentis/ontology'
import { ExternalAssertionError } from '@assessmentis/ontology'
import { FhirR4ClientService } from './FhirR4ClientService'
import type { NoSelectedOrgError } from '@assessmentis/platform-domain'

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
        Composition: clientEffect(CompositionFromFhirR4, 'Composition'),
        Encounter: clientEffect(EncounterFromFhirR4, 'Encounter'),
        Location: clientEffect(LocationFromFhirR4, 'Location'),
        Media: clientEffect(MediaFromFhirR4, 'Media'),
        Observation: clientEffect(ObservationFromFhirR4, 'Observation'),
        Patient: clientEffect(PatientFromFhirR4, 'Patient'),
        Practitioner: clientEffect(PractitionerFromFhirR4, 'Practitioner'),
        Questionnaire: clientEffect(QuestionnaireFromFhirR4, 'Questionnaire'),
        QuestionnaireResponse: clientEffect(
          QuestionnaireResponseFromFhirR4,
          'QuestionnaireResponse'
        ),
      }

      const stream: ClinicalDataRepositoryServiceType['stream'] = {
        Composition: clientStream(CompositionFromFhirR4, 'Composition'),
        Encounter: clientStream(EncounterFromFhirR4, 'Encounter'),
        Location: clientStream(LocationFromFhirR4, 'Location'),
        Media: clientStream(MediaFromFhirR4, 'Media'),
        Observation: clientStream(ObservationFromFhirR4, 'Observation'),
        Patient: clientStream(PatientFromFhirR4, 'Patient'),
        Practitioner: clientStream(PractitionerFromFhirR4, 'Practitioner'),
        Questionnaire: clientStream(QuestionnaireFromFhirR4, 'Questionnaire'),
        QuestionnaireResponse: clientStream(
          QuestionnaireResponseFromFhirR4,
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
