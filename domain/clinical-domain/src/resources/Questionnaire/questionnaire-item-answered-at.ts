import type { DateTime, Schema } from 'effect'

import { Extension } from '../../data-types'
import type { BackboneElement } from '../../data-types/base/backbone-element'

/**
 * Custom FHIR extension recording when a questionnaire item was answered.
 *
 * @remarks
 * Stores a dateTime value under the `questionnaire-item-answered-at` definition URL.
 * Provides `make`, `get`, and `withValue` helpers for constructing, reading, and
 * updating the extension on backbone elements.
 */
export namespace QuestionnaireItemAnsweredAtExtension {
  export const definitionUrl = 'http://assessment.is/fhir/questionnaire-item-answered-at'

  /** Creates an {@link Extension} carrying the answered-at timestamp. */
  export function make(
    data: { readonly valueDateTime: DateTime.Utc },
    options?: Schema.MakeOptions
  ): Extension {
    return new Extension(
      {
        definitionUrl,
        value: { _tag: 'dateTime', dateTime: data.valueDateTime },
      },
      options
    )
  }

  /** Extracts the answered-at timestamp from a backbone element's modifier extensions, if present. */
  export function get(be: BackboneElement<string>): DateTime.Utc | undefined {
    const ext = be.modifierExtension.find((e) => e.definitionUrl === definitionUrl)
    if (ext && ext.value?._tag === 'dateTime') {
      return ext.value?.dateTime
    }
    return undefined
  }

  /**
   * Returns a copy of `t` with the answered-at modifier extension set (or removed if `undefined`).
   */
  export function withValue<T extends { modifierExtension: readonly Extension[] }>(
    t: T,
    valueDateTime: DateTime.Utc | undefined
  ): T {
    return {
      ...t,
      modifierExtension: [
        ...t.modifierExtension.filter((e) => e.definitionUrl !== definitionUrl),
        // oxlint-disable-next-line eslint/no-ternary
        ...(valueDateTime
          ? [
              Extension.make({
                definitionUrl,
                value: { _tag: 'dateTime', dateTime: valueDateTime },
              }),
            ]
          : []),
      ],
    }
  }
}
