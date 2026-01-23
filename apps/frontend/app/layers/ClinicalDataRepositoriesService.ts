import { Effect, Layer, Schema } from 'effect'
import {
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
  Patient,
  Practitioner,
} from '@assessmentis/clinical-domain/administration'
import {
  Observation,
  Media,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { makeClinicalDataRepository } from '@assessmentis/clinical-domain/assessmentis'
import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import {
  AuthError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { FhirR4ClientService } from './FhirR4ClientService'
import { NoSelectedOrgError } from '@assessmentis/platform-domain'

export type GoogleFhirWebLayer<Key extends keyof typeof Schemas> = Layer.Layer<
  ClinicalDomainRepositoryTagClass<Key>,
  ExternalAssertionError,
  LoadedGoogleFhirConfig
>

export type ClinicalDataRepositoryServiceType = {
  [Key in keyof typeof Schemas]: Effect.Effect<
    ClinicalDataRepository<Schema.Schema.Type<(typeof Schemas)[Key]>>,
    | AuthError
    | NoSelectedOrgError
    | NotFoundError
    | UnhandledError
    | ExternalAssertionError
  >
}

export class ClinicalDataRepositoryService extends Effect.Service<ClinicalDataRepositoryService>()(
  'ClinicalDataRepositoryService',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      const clientService = yield* FhirR4ClientService

      const clientConstructor = <
        const ResourceType extends string,
        A extends { id?: string | undefined; resourceType: ResourceType },
        I extends { id?: string | undefined; resourceType: ResourceType },
      >(
        schema: Schema.Schema<A, I, never>,
        resourceType: ResourceType
      ): Effect.Effect<
        ClinicalDataRepository<A>,
        | AuthError
        | NoSelectedOrgError
        | NotFoundError
        | UnhandledError
        | ExternalAssertionError,
        never
      > =>
        Effect.map(clientService.client, (fhirClient) =>
          makeClinicalDataRepository(fhirClient, resourceType, schema)
        )

      return {
        Composition: clientConstructor(Composition, 'Composition'),
        Encounter: clientConstructor(Encounter, 'Encounter'),
        Media: clientConstructor(Media, 'Media'),
        Observation: clientConstructor(Observation, 'Observation'),
        Patient: clientConstructor(Patient, 'Patient'),
        Practitioner: clientConstructor(Practitioner, 'Practitioner'),
        Questionnaire: clientConstructor(Questionnaire, 'Questionnaire'),
        QuestionnaireResponse: clientConstructor(
          QuestionnaireResponse,
          'QuestionnaireResponse'
        ),
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
    | AuthError
    | NoSelectedOrgError
    | NotFoundError
    | UnhandledError
    | ExternalAssertionError,
    never
  > {
    return Effect.gen(function* () {
      const repoService = yield* ClinicalDataRepositoryService

      const repository = (yield* repoService[
        resourceType
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ]) satisfies ClinicalDataRepository<any>

      return repository as ClinicalDataRepository<TResource>
    }).pipe(Effect.provideService(ClinicalDataRepositoryService, this))
  }
}
