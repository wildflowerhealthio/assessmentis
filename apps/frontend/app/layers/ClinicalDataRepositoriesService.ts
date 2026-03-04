import {
  Effect,
  Either,
  pipe,
  Stream,
  type Layer,
  type Schema,
  type Scope,
} from 'effect'

import {
  Composition,
  DiagnosticReport,
  Encounter,
  Location,
  Media,
  Observation,
  Patient,
  Practitioner,
  Questionnaire,
  QuestionnaireResponse,
  type ClinicalDataRepository,
  type ClinicalDomainRepositoryTagClass,
  type ResourceDataTypes,
  type ResourceType,
} from '@assessmentis/clinical-domain'
import type { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import type { ReadonlyUrl } from '@assessmentis/effectful-store'
import {
  ExternalAssertionError,
  type AuthError,
  type UnhandledError,
} from '@assessmentis/ontology'
import type { NoSelectedOrgError } from '@assessmentis/platform-domain'

import { FhirR4ClientService } from './FhirR4ClientService'

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
    [Key in ResourceType]: Effect.Effect<
      ClinicalDataRepository<ResourceDataTypes[Key]>,
      AuthError | NoSelectedOrgError | UnhandledError
    >
  }

  stream: {
    [Key in ResourceType]: Stream.Stream<
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
        const DomainType extends string,
        A extends { domainType: DomainType; url?: ReadonlyUrl | undefined },
        I,
      >(
        schema: Schema.Schema<A, I, never>,
        resourceType: DomainType
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
        const DomainType extends string,
        A extends { domainType: DomainType; url?: ReadonlyUrl | undefined },
        I,
      >(
        schema: Schema.Schema<A, I, never>,
        resourceType: DomainType
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
        Composition: clientEffect(Composition, 'Composition'),
        DiagnosticReport: clientEffect(DiagnosticReport, 'DiagnosticReport'),
        Encounter: clientEffect(Encounter, 'Encounter'),
        Location: clientEffect(Location, 'Location'),
        Media: clientEffect(Media, 'Media'),
        Observation: clientEffect(Observation, 'Observation'),
        Patient: clientEffect(Patient, 'Patient'),
        Practitioner: clientEffect(Practitioner, 'Practitioner'),
        Questionnaire: clientEffect(Questionnaire, 'Questionnaire'),
        QuestionnaireResponse: clientEffect(
          QuestionnaireResponse,
          'QuestionnaireResponse'
        ),
      }

      const stream: ClinicalDataRepositoryServiceType['stream'] = {
        Composition: clientStream(Composition, 'Composition'),
        DiagnosticReport: clientStream(DiagnosticReport, 'DiagnosticReport'),
        Encounter: clientStream(Encounter, 'Encounter'),
        Location: clientStream(Location, 'Location'),
        Media: clientStream(Media, 'Media'),
        Observation: clientStream(Observation, 'Observation'),
        Patient: clientStream(Patient, 'Patient'),
        Practitioner: clientStream(Practitioner, 'Practitioner'),
        Questionnaire: clientStream(Questionnaire, 'Questionnaire'),
        QuestionnaireResponse: clientStream(
          QuestionnaireResponse,
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
  repositoryEffect<TResourceType extends ResourceType>(
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

  repositoryStream<TResource extends ResourceDataTypes[ResourceType]>(
    resourceType: TResource['domainType']
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
