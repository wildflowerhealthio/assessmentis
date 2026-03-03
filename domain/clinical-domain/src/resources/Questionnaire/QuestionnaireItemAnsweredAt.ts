import type { DateTime } from 'effect'
import type { Schema } from 'effect'
import { Extension } from '../../data-types'
import type { BackboneElement } from '../../data-types/base/BackboneElement'

export class QuestionnaireItemAnsweredAtExtension {
  static make(
    data: { readonly valueDateTime: DateTime.Utc },
    options?: Schema.MakeOptions
  ): Extension {
    return new Extension(
      {
        ...data,
        definitionUrl: QuestionnaireItemAnsweredAtExtension.definitionUrl,
      },
      options
    )
  }

  static readonly definitionUrl =
    'http://assessment.is/fhir/questionnaire-item-answered-at'

  static get(be: BackboneElement<string>): DateTime.Utc | undefined {
    const ext = be.modifierExtension.find(
      (ext) => ext.definitionUrl == this.definitionUrl
    )
    return ext && 'valueDateTime' in ext ? ext.valueDateTime : undefined
  }

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
              {
                definitionUrl: this.definitionUrl,
                valueDateTime: valueDateTime,
              },
            ]
          : []),
      ],
    }
  }
}
