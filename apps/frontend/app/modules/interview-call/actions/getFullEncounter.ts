import { Effect, Equal, Option, Stream, type Either, type Scope } from 'effect'

import {
  Location,
  type Encounter,
  type EncounterLocation,
  type Questionnaire,
  type QuestionnaireResponse,
} from '@assessmentis/clinical-domain'
import type { ReadonlyUrl, Resource } from '@assessmentis/effectful-store'
import {
  UnhandledError,
  type AuthError,
  type AuthzError,
  type ExternalAssertionError,
  type NotFoundError,
} from '@assessmentis/ontology'
import type { NoSelectedOrgError } from '@assessmentis/platform-domain'
import { StreamEither } from '@assessmentis/util'

import { ClinicalDataRepositoryService } from '../../../layers/ClinicalDataRepositoriesService'

export type FullEncounter = {
  encounter: Resource.WithResourceUrl<Encounter>
  questionnaireResponses: Array<{
    questionnaireResponse: Resource.WithResourceUrl<QuestionnaireResponse>
    questionnaire: Resource.WithResourceUrl<Questionnaire>
  }>
  locations: Array<Resource.WithResourceUrl<Location>>
}

export const getFullEncounter = (
  encounterUrl: Resource.InferResourceUrl<Encounter>
): Stream.Stream<
  Either.Either<
    FullEncounter,
    | UnhandledError
    | AuthError
    | AuthzError
    | NotFoundError<'Encounter', { readonly url: string | ReadonlyUrl }>
    | NotFoundError<'Location', { readonly url: string | ReadonlyUrl }>
    | ExternalAssertionError
    | NoSelectedOrgError
  >,
  never,
  ClinicalDataRepositoryService | Scope.Scope
> =>
  Stream.unwrap(
    Effect.gen(function* () {
      const clinicalDataRepositoryService = yield* ClinicalDataRepositoryService
      const encounterRepositoryStream =
        clinicalDataRepositoryService.stream.Encounter
      const locationRepositoryStream =
        clinicalDataRepositoryService.stream.Location

      const questionnaireRepositoryStream =
        clinicalDataRepositoryService.stream.Questionnaire
      const questionnaireResponseRepositoryStream =
        clinicalDataRepositoryService.stream.QuestionnaireResponse
      yield* Effect.logDebug('Getting full encounter with ID ', encounterUrl)

      yield* Effect.logDebug('encounterEffect started')

      // Fetch encounter and resolve its Location references
      const encounterWithLocationsStream = StreamEither.zipLatest(
        encounterRepositoryStream,
        locationRepositoryStream
      ).pipe(
        StreamEither.mapEffect(([encounterRepo, locationRepo]) =>
          Effect.gen(function* () {
            const encounter = yield* encounterRepo.get(encounterUrl)

            // Extract Location IDs from encounter location references
            const locationUrls = (encounter.location ?? []).map(
              (l: EncounterLocation) => l.location.asResourceUrl(Location)
            )

            // Fetch each referenced Location resource
            const locations = yield* Effect.allSuccesses(
              locationUrls.map((urlEffect) =>
                Effect.flatMap(urlEffect, (url) => locationRepo.get(url))
              )
            )

            return { encounter, locations }
          })
        )
      )

      const responseStream = StreamEither.zipLatest(
        questionnaireRepositoryStream,
        questionnaireResponseRepositoryStream
      ).pipe(
        StreamEither.mapEffect(
          ([questionnaireRepository, questionnaireResponseRepository]) =>
            Effect.gen(function* () {
              const allQuestionnaires = yield* questionnaireRepository.getMany()
              const responses = yield* questionnaireResponseRepository.getMany({
                encounter: encounterUrl.toString(),
              })

              return yield* Effect.all(
                responses.map((questionnaireResponse) =>
                  Option.fromNullable<
                    Resource.WithResourceUrl<Questionnaire> | undefined
                  >(
                    allQuestionnaires.find((q) =>
                      Equal.equals(q.url, questionnaireResponse.questionnaire)
                    )
                  ).pipe(
                    Option.map((questionnaire) =>
                      Effect.succeed<
                        FullEncounter['questionnaireResponses'][0]
                      >({
                        questionnaireResponse,
                        questionnaire,
                      })
                    ),
                    Option.getOrElse(() =>
                      Effect.fail(
                        new UnhandledError({
                          message: `Questionnaire Response's Questionnaire '${questionnaireResponse.questionnaire}' could not be found`,
                        })
                      )
                    )
                  )
                )
              )
            })
        )
      )

      return StreamEither.zipLatestWith(
        encounterWithLocationsStream,
        responseStream,
        ({ encounter, locations }, questionnaireResponses) => ({
          encounter,
          locations,
          questionnaireResponses,
        })
      )
    })
  )

/*
Effect.catchSome((err) =>
      err._tag == 'NotFoundError' && err.resourceType == 'Encounter'
        ? Option.some(
            Effect.fail(
              new NotFoundError({
                resourceType: 'Encounter',
                params: {
                  id:
                    'id' in err.params && typeof err.params.id === 'string'
                      ? EncounterId.make(err.params.id)
                      : undefined,
                },
              })
            )
          )
        : Option.none()
    )
        */
