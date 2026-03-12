import type { DateTime, Schema } from 'effect'

import { Extension } from '../../data-types'
import type { BackboneElement } from '../../data-types/base/BackboneElement'

/**
 * Custom FHIR extension recording when a questionnaire item was answered.
 *
 * @remarks
 * Stores a dateTime value under the `questionnaire-item-answered-at` definition URL.
 * Provides `make`, `get`, and `with` helpers for constructing, reading, and
 * updating the extension on backbone elements.
 */
export class QuestionnaireItemAnsweredAtExtension {
  /** Creates an {@link Extension} carrying the answered-at timestamp. */
  static make(
    data: { readonly valueDateTime: DateTime.Utc },
    options?: Schema.MakeOptions
  ): Extension {
    return new Extension(
      {
        definitionUrl: QuestionnaireItemAnsweredAtExtension.definitionUrl,
        value: { _tag: 'dateTime', dateTime: data.valueDateTime },
      },
      options
    )
  }

  static readonly definitionUrl =
    'http://assessment.is/fhir/questionnaire-item-answered-at'

  /** Extracts the answered-at timestamp from a backbone element's modifier extensions, if present. */
  static get(be: BackboneElement<string>): DateTime.Utc | undefined {
    const ext = be.modifierExtension.find(
      (ext) => ext.definitionUrl == this.definitionUrl
    )
    return ext && ext.value?._tag === 'dateTime'
      ? ext.value?.dateTime
      : undefined
  }

  /**
   * Returns a copy of \`t\` with the answered-at modifier extension set (or removed if \`undefined\`).
   */
  static with<T extends { modifierExtension: ReadonlyArray<Extension> }>(
    t: T,
    valueDateTime: DateTime.Utc | undefined
  ): T {
    return {
      ...t,
      modifierExtension: [
        ...t.modifierExtension.filter(
          (ext) => ext.definitionUrl !== this.definitionUrl
        ),
        ...(valueDateTime
          ? [
              Extension.make({
                definitionUrl: this.definitionUrl,
                value: { _tag: 'dateTime', dateTime: valueDateTime },
              }),
            ]
          : []),
      ],
    }
  }
}
