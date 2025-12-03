import { Schema } from "effect";
import { QuestionnaireResponseId } from "./QuestionnaireResponse";

export const TextQuestionnaireResponseValueId = Schema.UUID.pipe(
  Schema.brand("TextQuestionnaireResponseValueId"),
);

export type TextQuestionnaireResponseValueId =
  typeof TextQuestionnaireResponseValueId.Type;

export const TextQuestionnaireResponseValue = Schema.Struct({
  textQuestionnaireResponseValueId: TextQuestionnaireResponseValueId,
  questionnaireResponseItemId: QuestionnaireResponseId,
  value: Schema.String,
});

export type TextQuestionnaireResponseValue =
  typeof TextQuestionnaireResponseValue.Type;
