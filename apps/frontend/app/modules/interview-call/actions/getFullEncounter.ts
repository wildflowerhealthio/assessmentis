import { Effect, Option } from 'effect'
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
  encounterIdMaybe: Option.Option<EncounterId>
): Effect.Effect<
  FullEncounter,
  | UnhandledError
  | AuthError
  | AuthzError
  | NotFoundError
  | ExternalAssertionError
  | NoSelectedOrgError,
  ClinicalDataRepositoryService
> => {
  return Effect.gen(function* () {
    const encounterId = yield* encounterIdMaybe.pipe(
      Option.map(Effect.succeed),
      Option.getOrElse(() =>
        Effect.fail(
          new NotFoundError({
            resourceType: 'Encounter',
            params: { id: Option.getOrUndefined(encounterIdMaybe) },
          })
        )
      )
    )

    const clinicalDataRepositoryService = yield* ClinicalDataRepositoryService
    const encounterRepository = yield* clinicalDataRepositoryService.Encounter
    const questionnaireRepository =
      yield* clinicalDataRepositoryService.Questionnaire
    const questionnaireResponseRepository =
      yield* clinicalDataRepositoryService.QuestionnaireResponse
    yield* Effect.logDebug('Getting full encounter with ID ', encounterId)

    yield* Effect.logDebug('encounterEffect started')

    const encounterEffect = encounterRepository.get(encounterId)

    const questionnaireResponseGroupEffect = Effect.gen(function* () {
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
    })

    const [encounter, questionnaireResponses] = yield* Effect.all([
      encounterEffect,
      questionnaireResponseGroupEffect,
    ])

    const encounterRes: FullEncounter = {
      ...encounter,
      questionnaireResponses,
    }

    return encounterRes
  }).pipe(
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
    ),
    Effect.withSpan('getFullEncounter')
  )
}
