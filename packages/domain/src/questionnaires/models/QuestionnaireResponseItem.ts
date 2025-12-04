import { Schema } from 'effect'
import { QuestionnaireItemLink } from './Questionnaire'
import { BackboneElement } from '../../general-purpose/BackboneElement'
import { ValueElement } from '../../general-purpose/ValueElement'

export const QuestionnaireResponseItemId = Schema.String.pipe(
  Schema.brand('QuestionnaireResponseItemId')
)
export type QuestionnaireResponseItemId =
  typeof QuestionnaireResponseItemId.Type

export const QuestionnaireResponseItemAnswerId = Schema.String.pipe(
  Schema.brand('QuestionnaireResponseItemAnswerId')
)
export type QuestionnaireResponseItemAnswerId =
  typeof QuestionnaireResponseItemAnswerId.Type

const questionnaireResponseItemAnswerFields = {
  ...BackboneElement(QuestionnaireResponseItemAnswerId).fields,
}

export type QuestionnaireResponseItemAnswer = Schema.Struct.Type<
  typeof questionnaireResponseItemAnswerFields
> &
  typeof ValueElement.Type & {
    readonly item?: ReadonlyArray<QuestionnaireResponseItem> | undefined
  }

type QuestionnaireResponseItemAnswerEncoded = Schema.Struct.Encoded<
  typeof questionnaireResponseItemAnswerFields
> &
  typeof ValueElement.Encoded & {
    readonly item?: ReadonlyArray<QuestionnaireResponseItemEncoded> | undefined
  }

/**
 * The value is nested because we cannot have a repeating structure that has variable type.
 */
export const QuestionnaireResponseItemAnswer: Schema.Schema<
  QuestionnaireResponseItemAnswer,
  QuestionnaireResponseItemAnswerEncoded,
  never
> = Schema.extend(
  Schema.Struct({
    ...questionnaireResponseItemAnswerFields,
    /**
     * Nested groups and/or questions found within this particular answer.
     */
    item: Schema.optional(
      Schema.Array(
        Schema.suspend(
          (): Schema.Schema<
            QuestionnaireResponseItem,
            QuestionnaireResponseItemEncoded,
            never
          > => QuestionnaireResponseItem
        )
      )
    ),
  }),
  ValueElement
)

const questionnaireResponseItemFields = {
  ...BackboneElement(QuestionnaireResponseItemId).fields,
  /**
   * The ElementDefinition must be in a [StructureDefinition](structuredefinition.html#), and must have a fragment identifier that identifies the specific data element by its id (Element.id). E.g. http://hl7.org/fhir/StructureDefinition/Observation#Observation.value[x].
   * There is no need for this element if the item pointed to by the linkId has a definition listed.
   */
  definition: Schema.optional(Schema.String),
  // _definition?: Element | undefined;
  /**
   * The item from the Questionnaire that corresponds to this item in the QuestionnaireResponse resource.
   */
  linkId: QuestionnaireItemLink,
  // _linkId?: Element | undefined;
  /**
   * Text that is displayed above the contents of the group or as the text of the question being answered.
   */
  text: Schema.optional(Schema.String),
  // _text?: Element | undefined;
} as const

export interface QuestionnaireResponseItem extends Schema.Struct.Type<
  typeof questionnaireResponseItemFields
> {
  readonly item?: ReadonlyArray<QuestionnaireResponseItem> | undefined
  readonly answer?:
    | ReadonlyArray<typeof QuestionnaireResponseItemAnswer.Type>
    | undefined
}

export interface QuestionnaireResponseItemEncoded extends Schema.Struct.Encoded<
  typeof questionnaireResponseItemFields
> {
  readonly item?: ReadonlyArray<QuestionnaireResponseItemEncoded> | undefined
}

/**
 * Groups cannot have answers and therefore must nest directly within item. When dealing with questions, nesting must occur within each answer because some questions may have multiple answers (and the nesting occurs for each answer).
 */
export const QuestionnaireResponseItem = Schema.Struct({
  ...questionnaireResponseItemFields,
  /**
   * Questions or sub-groups nested beneath a question or group.
   */
  item: Schema.optional(
    Schema.Array(
      Schema.suspend(
        (): Schema.Schema<
          QuestionnaireResponseItem,
          QuestionnaireResponseItemEncoded,
          never
        > => QuestionnaireResponseItem
      )
    )
  ),
  /**
   * The value is nested because we cannot have a repeating structure that has variable type.
   */
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
})
