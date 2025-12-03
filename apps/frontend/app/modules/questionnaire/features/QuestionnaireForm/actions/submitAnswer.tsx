import { Effect } from "effect";
import { NeedsAuthenticationError, UnhandledError } from "assessmentis-domain";
import { QuestionnaireItemLink } from "assessmentis-domain";
import { QuestionnaireResponseId } from "assessmentis-domain";
import { QuestionnaireResponseItemAnswer } from "assessmentis-domain";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const makePatchItem = (
  id: QuestionnaireResponseId,
  linkId: QuestionnaireItemLink,
  answer: typeof QuestionnaireResponseItemAnswer.Type,
) => ({
  url: `${parent}/fhir/QuestionnaireResponse/${id}`,
  op: "replace",
  path: `/item/linkId:${linkId}/answer`,
  value: answer,
});

export const submitAnswer = (
  questionnaireItemLink: QuestionnaireItemLink,
  answer: typeof QuestionnaireResponseItemAnswer.Type | null,
): Effect.Effect<object, UnhandledError | NeedsAuthenticationError, never> =>
  Effect.gen(function* () {
    return {};
  }).pipe(
    Effect.withSpan("/questionnaire-responses/{:id}.form_answer_submission", {
      attributes: {
        answer_present: answer != null,
      },
    }),
    Effect.map((data) => JSON.parse(JSON.stringify(data))),
    Effect.withSpan("getFullEncounter"),
  );
