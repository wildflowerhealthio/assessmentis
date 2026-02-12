import { Effect, Either, Option, Scope, Stream } from 'effect'
import { StreamEither } from '@assessmentis/util'
import {
  Encounter,
  EncounterId,
} from '@assessmentis/clinical-domain/administration'
import {
  AuthError,
  AuthzError,
  UnhandledError,
  NotFoundError,
  ExternalAssertionError,
} from '@assessmentis/ontology'
import {
  Questionnaire,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain/content-management'
import { WithId } from '@assessmentis/clinical-domain/data-types'
import { NoSelectedOrgError } from '@assessmentis/platform-domain'
import { ClinicalDataRepositoryService } from '../../../layers/ClinicalDataRepositoriesService'
import { ClinicalStoreService } from '@assessmentis/clinical-store'

export type FullEncounter = WithId<Encounter> & {
  questionnaireResponses: Array<
    WithId<QuestionnaireResponse> & { _questionnaire: Questionnaire }
  >
}

/**
 * Get a full encounter with embedded questionnaire responses and questionnaires.
 * This version uses ClinicalStoreService for automatic batching and caching.
 */
export const getFullEncounterWithStore = (
  encounterId: EncounterId
): Effect.Effect<
  FullEncounter,
  | UnhandledError
  | AuthError
  | AuthzError
  | NotFoundError<'Encounter', { id: EncounterId }>
  | ExternalAssertionError
  | NoSelectedOrgError,
  ClinicalStoreService
> =>
  Effect.gen(function* () {
    const clinicalStoreService = yield* ClinicalStoreService

    yield* Effect.logDebug('Getting full encounter with ID ', encounterId)

    // Get the encounter
    const encounter = yield* clinicalStoreService.get('Encounter', encounterId)

    // Get all questionnaires (will be cached)
    const allQuestionnaires = yield* clinicalStoreService.search('Questionnaire')

    // Get questionnaire responses for this encounter
    const responses = yield* clinicalStoreService.search(
      'QuestionnaireResponse',
      {
        encounter: `Encounter/${encounterId}`,
      }
    )

    // Attach questionnaires to responses
    const questionnaireResponses = yield* Effect.all(
      responses.map(
        (
          qr
        ): Effect.Effect<
          FullEncounter['questionnaireResponses'][0],
          UnhandledError
        > =>
          Option.fromNullable<Questionnaire | undefined>(
            allQuestionnaires.find(({ id }) => id == qr.questionnaire)
          ).pipe(
            Option.map((_questionnaire: Questionnaire) =>
              Effect.succeed<FullEncounter['questionnaireResponses'][0]>({
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

    return {
      ...encounter,
      questionnaireResponses,
    }
  })

/**
 * Original stream-based version using ClinicalDataRepositoryService.
 * Kept for backwards compatibility during migration.
 */
export const getFullEncounter = (
  encounterId: EncounterId
): Stream.Stream<
  Either.Either<
    FullEncounter,
    | UnhandledError
    | AuthError
    | AuthzError
    | NotFoundError<'Encounter', { id: EncounterId }>
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

      const questionnaireRepositoryStream =
        clinicalDataRepositoryService.stream.Questionnaire
      const questionnaireResponseRepositoryStream =
        clinicalDataRepositoryService.stream.QuestionnaireResponse
      yield* Effect.logDebug('Getting full encounter with ID ', encounterId)

      yield* Effect.logDebug('encounterEffect started')

      const encounterStream = encounterRepositoryStream.pipe(
        StreamEither.mapEffect((repo) => repo.get(encounterId))
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
                      allQuestionnaires.find(({ id }) => id == qr.questionnaire)
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
        encounterStream,
        responseStream,
        (encounter, questionnaireResponses) => ({
          ...encounter,
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
