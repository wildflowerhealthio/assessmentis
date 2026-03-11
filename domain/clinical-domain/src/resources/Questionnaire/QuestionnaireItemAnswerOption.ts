import { Schema } from 'effect'

import { MergeClasses } from '@assessmentis/util'

import {
  BackboneElement,
  DatatypeChoice,
  type BackboneElementEncoded,
} from '../../data-types'
import FhirR4ChoiceElements from '../../data-types/fhirR4ChoiceElements'

const DomainType = 'QuestionnaireItemAnswerOption' as const
type DomainType = typeof DomainType

const fields = {
  initialSelected: Schema.optional(Schema.Boolean),
} as const satisfies Schema.Struct.Fields

class QuestionnaireItemAnswerOptionValue extends DatatypeChoice(
  'QuestionnaireItemAnswerOptionValue',
  'value',
  [
    'boolean',
    ...FhirR4ChoiceElements['Questionnaire.item.answerOption.value[x]'],
  ]
) {}
type AnswerOptionValueMixinEncoded =
  typeof QuestionnaireItemAnswerOptionValue.Encoded

/** Encoded (wire-format) shape of a {@link QuestionnaireItemAnswerOption}. */
export interface QuestionnaireItemAnswerOptionEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<DomainType>,
    AnswerOptionValueMixinEncoded {}

/** A permitted answer value for a questionnaire item, with a polymorphic value[x] choice. */
export class QuestionnaireItemAnswerOption extends MergeClasses<QuestionnaireItemAnswerOption>(
  DomainType
)(
  [],
  BackboneElement(DomainType),
  QuestionnaireItemAnswerOptionValue,
  fields
) {}
