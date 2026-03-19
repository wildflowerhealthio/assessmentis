import { Schema, pipe } from 'effect'
import type { Arbitrary, FastCheck } from 'effect'

import { BackboneElement, DatatypeChoice } from '../../data-types'
import type { BackboneElementEncoded } from '../../data-types'
import FhirR4ChoiceElements from '../../data-types/fhir-r4-choice-elements'

const DomainType = 'QuestionnaireItemAnswerOption' as const
type DomainType = typeof DomainType

const fields = {
  initialSelected: Schema.optional(Schema.Boolean),
  value: pipe(
    Schema.UndefinedOr(
      DatatypeChoice([
        'boolean',
        ...FhirR4ChoiceElements['Questionnaire.item.answerOption.value[x]'],
      ])
    ),
    Schema.annotations({
      arbitrary: (): Arbitrary.LazyArbitrary<undefined> => (fc: typeof FastCheck) =>
        fc.constant(undefined),
    }),
    Schema.optionalWith({ default: () => undefined })
  ),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of a {@link QuestionnaireItemAnswerOption}. */
export interface QuestionnaireItemAnswerOptionEncoded
  extends Schema.Struct.Encoded<typeof fields>, BackboneElementEncoded<DomainType> {}

/** A permitted answer value for a questionnaire item, with a polymorphic value[x] choice. */
const QuestionnaireItemAnswerOptionBackboneElement = BackboneElement(DomainType)

export class QuestionnaireItemAnswerOption extends QuestionnaireItemAnswerOptionBackboneElement.extend<QuestionnaireItemAnswerOption>(
  DomainType
)(fields) {
  static readonly DomainType = QuestionnaireItemAnswerOptionBackboneElement.DomainType
  static readonly UrlSchema = QuestionnaireItemAnswerOptionBackboneElement.UrlSchema
}
