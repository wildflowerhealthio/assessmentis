import type { Layer, Schema, Scope } from 'effect'
import { Effect, Either, pipe, Stream } from 'effect'
import type {
  Schemas,
  ClinicalDomainRepositoryTagClass,
  ClinicalDataRepository,
} from '@assessmentis/clinical-domain'
import {
  Composition,
  Questionnaire,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain/content-management'
import {
  Encounter,
  LocationFromFhirR4,
  Patient,
  Practitioner,
} from '@assessmentis/clinical-domain/administration'
import {
  Observation,
  Media,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { makeClinicalDataRepository } from '@assessmentis/clinical-domain/assessmentis'
import type { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import type { AuthError, UnhandledError } from '@assessmentis/ontology'
import { ExternalAssertionError } from '@assessmentis/ontology'
import { FhirR4ClientService } from './FhirR4ClientService'
import type { NoSelectedOrgError } from '@assessmentis/platform-domain'

export type GoogleFhirWebLayer<Key extends keyof typeof Schemas> = Layer.Layer<
  ClinicalDomainRepositoryTagClass<Key>,
  ExternalAssertionError,
  LoadedGoogleFhirConfig
>

export type ClinicalDataRepositoryServiceType = {
  effect: {
    [Key in keyof typeof Schemas]: Effect.Effect<
      ClinicalDataRepository<Schema.Schema.Type<(typeof Schemas)[Key]>>,
      AuthError | NoSelectedOrgError | UnhandledError
    >
  }

  stream: {
    [Key in keyof typeof Schemas]: Stream.Stream<
      Either.Either<
        ClinicalDataRepository<Schema.Schema.Type<(typeof Schemas)[Key]>>,
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

      return {
        effect: {
          Composition: clientEffect(Composition, 'Composition'),
          Encounter: clientEffect(Encounter, 'Encounter'),
          Location: clientEffect(LocationFromFhirR4, 'Location'),
          Media: clientEffect(Media, 'Media'),
          Observation: clientEffect(Observation, 'Observation'),
          Patient: clientEffect(Patient, 'Patient'),
          Practitioner: clientEffect(Practitioner, 'Practitioner'),
          Questionnaire: clientEffect(Questionnaire, 'Questionnaire'),
          QuestionnaireResponse: clientEffect(
            QuestionnaireResponse,
            'QuestionnaireResponse'
          ),
        },
        stream: {
          Composition: clientStream(Composition, 'Composition'),
          Encounter: clientStream(Encounter, 'Encounter'),
          Location: clientStream(LocationFromFhirR4, 'Location'),
          Media: clientStream(Media, 'Media'),
          Observation: clientStream(Observation, 'Observation'),
          Patient: clientStream(Patient, 'Patient'),
          Practitioner: clientStream(Practitioner, 'Practitioner'),
          Questionnaire: clientStream(Questionnaire, 'Questionnaire'),
          QuestionnaireResponse: clientStream(
            QuestionnaireResponse,
            'QuestionnaireResponse'
          ),
        },
      } satisfies ClinicalDataRepositoryServiceType
    }),
  }
) {
  repositoryEffect<
    TResource extends Schema.Schema.Type<
      (typeof Schemas)[keyof typeof Schemas]
    >,
  >(
    resourceType: TResource['resourceType']
  ): Effect.Effect<
    ClinicalDataRepository<TResource>,
    AuthError | NoSelectedOrgError | UnhandledError,
    never
  > {
    return Effect.gen(function* () {
      const repoService = yield* ClinicalDataRepositoryService

      const repository = (yield* repoService.effect[
        resourceType
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ]) satisfies ClinicalDataRepository<any>

      return repository as ClinicalDataRepository<TResource>
    }).pipe(Effect.provideService(ClinicalDataRepositoryService, this))
  }

  repositoryStream<
    TResource extends Schema.Schema.Type<
      (typeof Schemas)[keyof typeof Schemas]
    >,
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
          service.stream[resourceType] satisfies Stream.Stream<
            Either.Either<
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ClinicalDataRepository<any>,
              AuthError | NoSelectedOrgError | UnhandledError
            >,
            never,
            Scope.Scope
          > as Stream.Stream<
            Either.Either<
              ClinicalDataRepository<TResource>,
              AuthError | NoSelectedOrgError | UnhandledError
            >,
            never,
            Scope.Scope
          >
      ),
      (a) => a,
      Effect.provideService(ClinicalDataRepositoryService, this),
      Stream.unwrap
    )
  }
}
