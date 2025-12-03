import { Effect, Schema, Option, Data } from "effect";
import {
  Encounter,
  EncounterId,
  EncounterNotFound,
  EncounterRepository, NeedsAuthenticationError, UnhandledError,QuestionnaireResponse ,QuestionnaireResponseRepository, VideoCallRoom, VideoCallRepository,
  NotFoundError,
  ExternalAssertionError,
  } from "assessmentis-domain"

export const FullEncounter = Schema.Struct({
  ...Encounter.fields,
  questionnaireResponses: Schema.Array(
    Schema.Struct({
      ...QuestionnaireResponse.fields,
      // _questionnaire: Questionnaire,
    }),
  ),
});

export type FullEncounter = typeof FullEncounter.Type;

export type FullEncounterResult = Data.TaggedEnum<{
  Success: { readonly data: typeof FullEncounter.Encoded };
  NotFound: { readonly encounterId: EncounterId | undefined };
}>;

const { NotFound, Success } = Data.taggedEnum<FullEncounterResult>();

export const getFullEncounter = (
  encounterIdMaybe: Option.Option<EncounterId>,
): Effect.Effect<
  FullEncounterResult,
  UnhandledError | NeedsAuthenticationError | NotFoundError | ExternalAssertionError,
  EncounterRepository | VideoCallRepository | QuestionnaireResponseRepository
> => {
  return Effect.gen(function* () {
    const encounterId = yield* encounterIdMaybe.pipe(
      Option.map(Effect.succeed),
      Option.getOrElse(() => Effect.fail(new EncounterNotFound({}))),
    );

    const encounterRepository = yield* EncounterRepository;
    const videoCallRepository = yield* VideoCallRepository;
    const questionnaireResponseRepository =
      yield* QuestionnaireResponseRepository;
    yield* Effect.logDebug("Getting full encounter with ID ", encounterId);

    yield* Effect.logDebug("encounterEffect started");

    const encounterEffect = encounterRepository.getEncounter(encounterId);

    const questionnaireResponseGroupEffect =
      questionnaireResponseRepository.getQuestionnaireResponses({
        encounterId,
      });

    const [encounter, questionnaireResponses] =
      yield* Effect.all([
        encounterEffect,
        questionnaireResponseGroupEffect,
      ]);

    const encounterRes: FullEncounter = {
      ...encounter,
      questionnaireResponses,
    };

    return encounterRes;
  }).pipe(
    Effect.flatMap((encounter) => Schema.encode(FullEncounter)(encounter)),
    Effect.map((data) => Success({ data: data })),
    Effect.catchTag("EncounterNotFound", ({ encounterId }) =>
      Effect.succeed(NotFound({ encounterId })),
    ),
    Effect.catchTag("ParseError", (cause) =>
      Effect.fail(new UnhandledError({ cause: cause.toJSON() })),
    ),
    Effect.map((data) => JSON.parse(JSON.stringify(data))),
    Effect.withSpan("getFullEncounter"),
  );
};
