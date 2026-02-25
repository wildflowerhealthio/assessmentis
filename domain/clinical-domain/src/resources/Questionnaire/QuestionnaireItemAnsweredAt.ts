import type { DateTime } from 'effect'
import { Schema } from 'effect'
import { Element } from '../../data-types'
import type { BackboneElement } from '../../data-types/base/BackboneElement'

const ElementMixin = Element('Extension')

export class QuestionnaireItemAnsweredAtExtension extends Schema.Class<QuestionnaireItemAnsweredAtExtension>(
  'QuestionnaireItemAnsweredAtExtension'
)({
  ...ElementMixin.fields,
  definitionUrl: Schema.Literal(
    'http://assessment.is/fhir/questionnaire-item-answered-at'
  ),
  valueDateTime: Schema.DateTimeUtc,
}) {
  static readonly definitionUrl = this.fields.definitionUrl.literals[0]

  static get(be: BackboneElement<string>): DateTime.Utc | undefined {
    const ext = be.modifierExtension.find(
      (ext) => ext.definitionUrl == this.definitionUrl
    )
    return ext && 'valueDateTime' in ext ? ext.valueDateTime : undefined
  }

  static with<T extends BackboneElement<string>>(
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
