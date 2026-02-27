import { Schema } from 'effect'
import { QuestionnaireItemLink } from '../Questionnaire/Questionnaire'
import {
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types/base/BackboneElement'
import FhirR4ChoiceElements from '../../data-types/fhirR4ChoiceElements'
import { DatatypeChoice } from '../../data-types/Datatype'
import { MergeClasses } from '@assessmentis/util'

const questionnaireResponseItemAnswerFields = {}

const valueMixin = DatatypeChoice(
  'value',
  FhirR4ChoiceElements['QuestionnaireResponse.item.answer.value[x]']
)
type valueMixinEncoded = Schema.Struct.Encoded<typeof valueMixin.fields>
export interface QuestionnaireResponseItemAnswerEncoded
  extends
    Schema.Struct.Encoded<typeof questionnaireResponseItemAnswerFields>,
    BackboneElementEncoded<'QuestionnaireResponseItemAnswer'>,
    valueMixinEncoded {
  item?: ReadonlyArray<QuestionnaireResponseItemEncoded> | undefined
}

/**
 * The value is nested because we cannot have a repeating structure that has variable type.
 */
export class QuestionnaireResponseItemAnswer extends MergeClasses<QuestionnaireResponseItemAnswer>(
  'QuestionnaireResponseItemAnswer'
)(BackboneElement('QuestionnaireResponseItemAnswer'), valueMixin, {
  ...questionnaireResponseItemAnswerFields,

  item: Schema.optional(
    Schema.Array(
      Schema.suspend(
        (): Schema.Schema<
          QuestionnaireResponseItem,
          QuestionnaireResponseItemEncoded
        > => QuestionnaireResponseItem
      )
    )
  ),
}) {}

const questionnaireResponseItemFields = {
  definition: Schema.optional(Schema.String),
  linkId: QuestionnaireItemLink,
  text: Schema.optional(Schema.String),
}

export interface QuestionnaireResponseItemEncoded
  extends
    Schema.Struct.Encoded<typeof questionnaireResponseItemFields>,
    BackboneElementEncoded<'QuestionnaireResponseItem'> {
  item?: ReadonlyArray<QuestionnaireResponseItemEncoded> | undefined
  answer?: ReadonlyArray<QuestionnaireResponseItemAnswerEncoded> | undefined
}
/**
 * Groups cannot have answers and therefore must nest directly within item.
 * When dealing with questions, nesting must occur within each answer because
 * some questions may have multiple answers (and the nesting occurs for each answer).
 */
export class QuestionnaireResponseItem extends Schema.Class<QuestionnaireResponseItem>(
  'QuestionnaireResponseItem'
)({
  ...BackboneElement('QuestionnaireResponseItem').fields,
  ...questionnaireResponseItemFields,
  item: Schema.optional(
    Schema.Array(
      Schema.suspend(
        (): Schema.Schema<
          QuestionnaireResponseItem,
          QuestionnaireResponseItemEncoded
        > => QuestionnaireResponseItem
      )
    )
  ),
  answer: Schema.optional(
    Schema.Array(
      Schema.suspend(
        (): Schema.Schema<
          QuestionnaireResponseItemAnswer,
          QuestionnaireResponseItemAnswerEncoded
        > => QuestionnaireResponseItemAnswer
      )
    )
  ),
}) {
  *deepQuestionnaireResponseItems(): Generator<QuestionnaireResponseItem> {
    for (const child of this.item ?? []) {
      yield child
      yield* child.deepQuestionnaireResponseItems()
    }
  }
}
