import { Schema, DateTime } from 'effect'
import { type BackboneElement } from '../../data-types/base/BackboneElement'

export const questionnaireItemAnsweredAtUrl =
  'http://assessment.is/fhir/questionnaire-item-answered-at'

export const QuestionnaireItemAnsweredAtExtension = Schema.Struct({
  url: Schema.Literal(questionnaireItemAnsweredAtUrl),
  valueDateTime: Schema.DateTimeUtc,
})

export const getAnsweredAt = (
  be: BackboneElement<string>
): DateTime.Utc | undefined => {
  const ext = be.modifierExtension?.find(
    (ext) => ext.url == questionnaireItemAnsweredAtUrl
  )
  return ext && 'valueDateTime' in ext ? ext.valueDateTime : undefined
}

export const withAnsweredAt = <
  IdType extends string,
  T extends BackboneElement<IdType>,
>(
  t: T,
  valueDateTime: DateTime.Utc | undefined
): T => {
  return {
    ...t,
    modifierExtension: [
      ...(t.modifierExtension?.filter(
        (ext) => ext.url !== questionnaireItemAnsweredAtUrl
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
  }
}
