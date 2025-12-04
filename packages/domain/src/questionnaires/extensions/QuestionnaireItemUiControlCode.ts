import { Schema, Option } from 'effect'
import { type BackboneElement } from '../../general-purpose/BackboneElement'
import { Code, Extension } from '../../general-purpose'

export const QuestionnaireItemUIControlCode = Schema.Enums({
  list: Code.make('list'),
  table: Code.make('table'),
} as const)

export const questionnaireItemUiControlCodeExtension = (
  value: typeof QuestionnaireItemUIControlCode.Type
): Extension => ({
  url: questionnaireItemControlUrl,
  valueCode: value,
})

export const questionnaireItemControlUrl =
  'http://hl7.org/fhir/questionnaire-item-control'

export const getUiControlCode = (
  be: BackboneElement<string>
): typeof QuestionnaireItemUIControlCode.Type | undefined => {
  const ext = be.modifierExtension?.find(
    (ext) => ext.url == questionnaireItemControlUrl
  )
  const code =
    ext && 'valueCode' in ext
      ? Schema.decodeUnknownOption(QuestionnaireItemUIControlCode)(
          ext.valueCode
        ).pipe(Option.getOrUndefined)
      : undefined

  return code
}

export const withUiControlCode = <
  IdType extends string,
  T extends BackboneElement<IdType>,
>(
  t: T,
  value: typeof QuestionnaireItemUIControlCode.Type | undefined
): T => {
  return {
    ...t,
    modifierExtension: [
      ...(t.modifierExtension?.filter(
        (ext) => ext.url == questionnaireItemControlUrl
      ) ?? []),
      ...(value ? [questionnaireItemUiControlCodeExtension(value)] : []),
    ],
  }
}
