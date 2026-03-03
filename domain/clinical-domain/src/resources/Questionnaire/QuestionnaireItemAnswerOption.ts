import { Schema } from 'effect'
import {
  BackboneElement,
  type BackboneElementEncoded,
  DatatypeChoice,
} from '../../data-types'
import FhirR4ChoiceElements from '../../data-types/fhirR4ChoiceElements'
import { MergeClasses } from '@assessmentis/util'

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

export interface QuestionnaireItemAnswerOptionEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<DomainType>,
    AnswerOptionValueMixinEncoded {}

export class QuestionnaireItemAnswerOption extends MergeClasses<QuestionnaireItemAnswerOption>(
  DomainType
)(
  [],
  BackboneElement(DomainType),
  QuestionnaireItemAnswerOptionValue,
  fields
) {}
