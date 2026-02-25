import { Schema, Option } from 'effect'
import type { BackboneElement } from '../../data-types/base/BackboneElement'
import { Code } from '../../data-types/complex/Code'

export const QuestionnaireItemUiDisplayLevel = Schema.Enums({
  heading1: Code.make('heading1'),
  heading2: Code.make('heading2'),
  heading3: Code.make('heading3'),
  heading4: Code.make('heading4'),
} as const)

export const questionnaireItemUiDisplayLevelUrl =
  'http://assessment.is/fhir/questionnaire-item-display-level'

export const questionnaireItemUiDisplayLevelExtension = (
  value: typeof QuestionnaireItemUiDisplayLevel.Type
) => ({
  definitionUrl: questionnaireItemUiDisplayLevelUrl,
  valueCode: value,
})

export const getUiDisplayLevel = (
  be: BackboneElement<string>
): typeof QuestionnaireItemUiDisplayLevel.Type | undefined => {
  const ext = be.modifierExtension.find(
    (ext) => ext.definitionUrl == questionnaireItemUiDisplayLevelUrl
  )
  const code =
    ext && 'valueCode' in ext
      ? Schema.decodeUnknownOption(QuestionnaireItemUiDisplayLevel)(
          ext.valueCode
        ).pipe(Option.getOrUndefined)
      : undefined

  return code
}

export const withUiDisplayLevel = <
  IdType extends string,
  T extends BackboneElement<IdType>,
>(
  t: T,
  value: typeof QuestionnaireItemUiDisplayLevel.Type | undefined
): T => {
  return {
    ...t,
    modifierExtension: [
      ...t.modifierExtension.filter(
        (ext) => ext.definitionUrl !== questionnaireItemUiDisplayLevelUrl
      ),
      ...(value ? [questionnaireItemUiDisplayLevelExtension(value)] : []),
    ],
  }
}
