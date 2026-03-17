import { Schema } from 'effect'

import { MergeClasses } from '@assessmentis/util'

import { BackboneElement, DatatypeChoice } from '../../data-types'
import type { BackboneElementEncoded } from '../../data-types'
import FhirR4ChoiceElements from '../../data-types/fhirR4ChoiceElements'

const DomainType = 'QuestionnaireItemAnswerOption' as const
type DomainType = typeof DomainType

const fields = {
  initialSelected: Schema.optional(Schema.Boolean),
  value: Schema.optional(
    DatatypeChoice([
      'boolean',
      ...FhirR4ChoiceElements['Questionnaire.item.answerOption.value[x]'],
    ])
  ),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of a {@link QuestionnaireItemAnswerOption}. */
export interface QuestionnaireItemAnswerOptionEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<DomainType> {}

/** A permitted answer value for a questionnaire item, with a polymorphic value[x] choice. */
export class QuestionnaireItemAnswerOption extends MergeClasses<QuestionnaireItemAnswerOption>(
  DomainType
)([], BackboneElement(DomainType), fields) {}
