import { Effect, Either, Option, Scope, Stream } from 'effect'
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

export type FullEncounter = WithId<Encounter> & {
  questionnaireResponses: Array<
    WithId<QuestionnaireResponse> & { _questionnaire: Questionnaire }
  >
}

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
        Stream.mapEffect((encounterRepoEither) =>
          Effect.either(
            Effect.flatMap(encounterRepoEither, (encounterRepository) =>
              encounterRepository.get(encounterId)
            )
          )
        )
      )

      const responseStream = Stream.zipLatest(
        questionnaireRepositoryStream,
        questionnaireResponseRepositoryStream
      ).pipe(
        Stream.mapEffect(
          ([
            eitherQuestionnaireRepository,
            eitherQuestionnaireResponseRepository,
          ]) =>
            Effect.gen(function* () {
              const questionnaireRepository =
                yield* eitherQuestionnaireRepository
              const questionnaireResponseRepository =
                yield* eitherQuestionnaireResponseRepository
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
            }).pipe(Effect.either)
        )
      )

      return Stream.zipLatestWith(
        encounterStream,
        responseStream,
        (encounterEither, questionnaireResponsesEither) =>
          Either.all([
            encounterEither,
            questionnaireResponsesEither,
          ] as const).pipe(
            Either.map(([encounter, questionnaireResponses]) => ({
              ...encounter,
              questionnaireResponses,
            }))
          )
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
