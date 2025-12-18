import { Effect, Schema, Option, Data } from 'effect'
import {
  Encounter,
  EncounterId,
  EncounterNotFound,
  EncounterRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  NeedsAuthenticationError,
  UnhandledError,
  NotFoundError,
  ExternalAssertionError,
} from '@assessmentis/ontology'
import {
  Questionnaire,
  QuestionnaireRepository,
  QuestionnaireResponse,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/content-management'

export const FullEncounter = Schema.Struct({
  ...Encounter.fields,
  questionnaireResponses: Schema.Array(
    Schema.Struct({
      ...QuestionnaireResponse.fields,
      _questionnaire: Questionnaire,
    })
  ),
})

export type FullEncounter = typeof FullEncounter.Type

export type FullEncounterResult = Data.TaggedEnum<{
  Success: { readonly data: typeof FullEncounter.Encoded }
  NotFound: { readonly encounterId: EncounterId | undefined }
}>

const { NotFound, Success } = Data.taggedEnum<FullEncounterResult>()

export const getFullEncounter = (
  encounterIdMaybe: Option.Option<EncounterId>
): Effect.Effect<
  FullEncounterResult,
  | UnhandledError
  | NeedsAuthenticationError
  | NotFoundError
  | ExternalAssertionError,
  | EncounterRepository
  | QuestionnaireResponseRepository
  | QuestionnaireRepository
> => {
  return Effect.gen(function* () {
    const encounterId = yield* encounterIdMaybe.pipe(
      Option.map(Effect.succeed),
      Option.getOrElse(() => Effect.fail(new EncounterNotFound({})))
    )

    const encounterRepository = yield* EncounterRepository
    const questionnaireRepository = yield* QuestionnaireRepository
    const questionnaireResponseRepository =
      yield* QuestionnaireResponseRepository
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
                    cause: `Questionnaire Response's Questionnaire '${qr.questionnaire}' could not be found`,
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
    Effect.flatMap((encounter) => Schema.encode(FullEncounter)(encounter)),
    Effect.map((data) => Success({ data: data })),
    Effect.catchTag('EncounterNotFound', ({ encounterId }) =>
      Effect.succeed(NotFound({ encounterId }))
    ),
    Effect.catchTag('ParseError', (cause) =>
      Effect.fail(new UnhandledError({ cause: cause.toJSON() }))
    ),
    Effect.map((data) => JSON.parse(JSON.stringify(data))),
    Effect.withSpan('getFullEncounter')
  )
}
