import { Schema } from 'effect'

import type { BackboneElement } from '../../data-types/base/BackboneElement'
import { Code } from '../../data-types/complex/Code'
import { Extension } from '../../data-types/special-purpose/Extension'

/** FHIR questionnaire item UI control codes — determines list vs table rendering. */
export const QuestionnaireItemUIControlCode = Schema.Enums({
  list: Code.make('list'),
  table: Code.make('table'),
} as const)

/** Extension URL for the FHIR questionnaire-item-control extension. */
export const questionnaireItemControlUrl =
  'http://hl7.org/fhir/questionnaire-item-control'

/**
 * Creates an {@link Extension} carrying a UI control code for a questionnaire item.
 *
 * @param value - The UI control code to embed
 */
export const questionnaireItemUiControlCodeExtension = (
  value: typeof QuestionnaireItemUIControlCode.Type
): Extension =>
  Extension.make({
    definitionUrl: questionnaireItemControlUrl,
    value: {
      _tag: 'code',
      code: value,
    },
  })

/**
 * Extracts the UI control code from a backbone element's modifier extensions.
 *
 * @param be - The backbone element to inspect
 * @returns The decoded UI control code, or `undefined` if not present
 */
export const getUiControlCode = (
  be: BackboneElement<string>
): typeof QuestionnaireItemUIControlCode.Type | undefined => {
  const ext = be.modifierExtension.find(
    (ext) => ext.definitionUrl == questionnaireItemControlUrl
  )
  const { value } = ext ?? {}
  const code =
    value && value._tag === 'code' && typeof value.code === 'string'
      ? value.code
      : undefined

  return code ? Code.make(code) : undefined
}

/**
 * Returns a copy of `t` with the UI control code modifier extension set (or removed if `undefined`).
 *
 * @typeParam IdType - The backbone element's domain type string
 * @typeParam T - The backbone element type
 * @param t - The element to update
 * @param value - The UI control code to set, or `undefined` to remove
 */
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
      ...t.modifierExtension.filter(
        (ext) => ext.definitionUrl !== questionnaireItemControlUrl
      ),
      ...(value ? [questionnaireItemUiControlCodeExtension(value)] : []),
    ],
  }
}
