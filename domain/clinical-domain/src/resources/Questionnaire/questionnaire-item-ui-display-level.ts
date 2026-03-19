import { Schema } from 'effect'

import type { BackboneElement } from '../../data-types/base/backbone-element'
import { Code } from '../../data-types/complex/code'
import { Extension } from '../../data-types/special-purpose/extension'

/** Custom display-level codes for questionnaire item heading hierarchy. */
export const QuestionnaireItemUiDisplayLevel = Schema.Enums({
  heading1: Code.make('heading1'),
  heading2: Code.make('heading2'),
  heading3: Code.make('heading3'),
  heading4: Code.make('heading4'),
} as const)

/** Extension URL for the custom questionnaire-item-display-level extension. */
export const questionnaireItemUiDisplayLevelUrl =
  'http://assessment.is/fhir/questionnaire-item-display-level'

/**
 * Creates an {@link Extension} carrying a display level for a questionnaire item.
 *
 * @param value - The display level code to embed
 */
export const questionnaireItemUiDisplayLevelExtension = (
  value: typeof QuestionnaireItemUiDisplayLevel.Type
): Extension =>
  Extension.make({
    definitionUrl: questionnaireItemUiDisplayLevelUrl,
    value: {
      _tag: 'code',
      code: value,
    },
  })

/**
 * Extracts the display level from a backbone element's modifier extensions.
 *
 * @param be - The backbone element to inspect
 * @returns The decoded display level, or `undefined` if not present
 */
export const getUiDisplayLevel = (
  be: BackboneElement<string>
): typeof QuestionnaireItemUiDisplayLevel.Type | undefined => {
  const ext = be.modifierExtension.find(
    (e) => e.definitionUrl === questionnaireItemUiDisplayLevelUrl
  )
  const { value } = ext ?? {}
  let code: string | undefined
  if (value && value._tag === 'code' && typeof value.code === 'string') {
    code = value.code
  } else {
    code = undefined
  }

  if (code) {
    return Code.make(code)
  }
  return undefined
}

/**
 * Returns a copy of `t` with the display level modifier extension set (or removed if `undefined`).
 *
 * @typeParam IdType - The backbone element's domain type string
 * @typeParam T - The backbone element type
 * @param t - The element to update
 * @param value - The display level to set, or `undefined` to remove
 */
export const withUiDisplayLevel = <IdType extends string, T extends BackboneElement<IdType>>(
  t: T,
  value: typeof QuestionnaireItemUiDisplayLevel.Type | undefined
): T => ({
  ...t,
  modifierExtension: [
    ...t.modifierExtension.filter(
      (ext) => ext.definitionUrl !== questionnaireItemUiDisplayLevelUrl
    ),
    // oxlint-disable-next-line eslint/no-ternary
    ...(value ? [questionnaireItemUiDisplayLevelExtension(value)] : []),
  ],
})
