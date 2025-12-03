import { Schema, Option, DateTime } from "effect";
import { type BackboneElement } from "../../general-purpose/BackboneElement";

export const questionnaireItemAnsweredAtUrl =
  "http://assessment.is/fhir/questionnaire-item-answered-at";

export const QuestionnaireItemAnsweredAtExtension = Schema.Struct({
  url: Schema.Literal(questionnaireItemAnsweredAtUrl),
  valueDateTime: Schema.DateTimeUtc,
});

export const getAnsweredAt = (
  be: BackboneElement<string>,
): DateTime.Utc | undefined => {
  const ext = be.modifierExtension?.find(
    (ext) => ext.url == questionnaireItemAnsweredAtUrl,
  );
  const code =
    ext && "valueDateTime" in ext
      ? Schema.decodeUnknownOption(QuestionnaireItemAnsweredAtExtension)(
          ext,
        ).pipe(Option.getOrUndefined)
      : undefined;

  return code?.valueDateTime;
};

export const withAnsweredAt = <
  IdType extends string,
  T extends BackboneElement<IdType>,
>(
  t: T,
  valueDateTime: DateTime.Utc | undefined,
): T => {
  return {
    ...t,
    modifierExtension: [
      ...(t.modifierExtension?.filter(
        (ext) => ext.url == questionnaireItemAnsweredAtUrl,
      ) ?? []),
      ...(valueDateTime
        ? [
            {
              url: questionnaireItemAnsweredAtUrl,
              valueDateTime: valueDateTime,
            },
          ]
        : []),
    ],
  };
};
