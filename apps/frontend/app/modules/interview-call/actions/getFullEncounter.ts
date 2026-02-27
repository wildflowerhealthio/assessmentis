import type { Either, Scope } from 'effect'
import { Effect, Option, Stream } from 'effect'
import { StreamEither } from '@assessmentis/util'
import type {
  Encounter,
  Location,
  Questionnaire,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain'
import type {
  AuthError,
  AuthzError,
  NotFoundError,
  ExternalAssertionError,
} from '@assessmentis/ontology'
import { UnhandledError } from '@assessmentis/ontology'
import type { Resource } from '@assessmentis/effectful-store'
import { extractReferenceId } from '@assessmentis/clinical-domain/data-types'
import type { NoSelectedOrgError } from '@assessmentis/platform-domain'
import { ClinicalDataRepositoryService } from '../../../layers/ClinicalDataRepositoriesService'

export type FullEncounter = Resource.WithResourceUrl<Encounter> & {
  questionnaireResponses: Array<
    Resource.WithResourceUrl<QuestionnaireResponse> & {
      _questionnaire: Questionnaire
    }
  >
  _locations: Array<Resource.WithResourceUrl<Location>>
}

export const getFullEncounter = (
  encounterId: string
): Stream.Stream<
  Either.Either<
    FullEncounter,
    | UnhandledError
    | AuthError
    | AuthzError
    | NotFoundError<'Encounter', { url: string }>
    | NotFoundError<'Location', { url: string }>
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
      yield* Effect.logDebug('Getting full encounter with ID ', encounterId)

      yield* Effect.logDebug('encounterEffect started')

      // Fetch encounter and resolve its Location references
      const encounterWithLocationsStream = StreamEither.zipLatest(
        encounterRepositoryStream,
        locationRepositoryStream
      ).pipe(
        StreamEither.mapEffect(([encounterRepo, locationRepo]) =>
          Effect.gen(function* () {
            const encounter = yield* encounterRepo.get(encounterId)

            // Extract Location IDs from encounter location references
            const locationIds = (encounter.location ?? [])
              .map((l) => extractReferenceId(l.location))
              .filter((id): id is string => !!id)

            // Fetch each referenced Location resource
            const _locations = yield* Effect.all(
              locationIds.map((id) => locationRepo.get(id))
            )

            return { encounter, _locations }
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
                encounter: `Encounter/${encounterId}`,
              })

              return yield* Effect.all(
                responses.map(
                  (
                    qr
                  ): Effect.Effect<
                    FullEncounter['questionnaireResponses'][0],
                    UnhandledError
                  > =>
                    Option.fromNullable<Questionnaire | undefined>(
                      allQuestionnaires.find(
                        (q) => q.url?.toString() === qr.questionnaire
                      )
                    ).pipe(
                      Option.map((_questionnaire: Questionnaire) =>
                        Effect.succeed<
                          FullEncounter['questionnaireResponses'][0]
                        >({
                          ...qr,
                          _questionnaire,
                        })
                      ),
                      Option.getOrElse(() =>
                        Effect.fail(
                          new UnhandledError({
                            message: `Questionnaire Response's Questionnaire '${qr.questionnaire}' could not be found`,
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
        ({ encounter, _locations }, questionnaireResponses) => ({
          ...encounter,
          _locations,
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
