import { Schema } from 'effect'
import { QuestionnaireItemLink } from '../Questionnaire/Questionnaire'
import { BackboneElement } from '../../../data-types/base/BackboneElement'
import { ValueElement } from '../../../data-types/primitive/ValueElement'

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

export interface QuestionnaireResponseItemAnswer
  extends BackboneElement<QuestionnaireResponseItemAnswerId>, ValueElement {
  item?: QuestionnaireResponseItem[]
}

/**
 * The value is nested because we cannot have a repeating structure that has variable type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const QuestionnaireResponseItemAnswerSchema: Schema.Schema<
  QuestionnaireResponseItemAnswer,
  any,
  never
> = Schema.extend(
  Schema.extend(
    BackboneElement.Schema(QuestionnaireResponseItemAnswerId),
    Schema.Struct({
      item: Schema.optional(
        Schema.mutable(Schema.Array(
          Schema.suspend(
            () => QuestionnaireResponseItemSchema
          )
        ))
      ),
    })
  ),
  Schema.suspend(() => ValueElement.Schema)
)

export const QuestionnaireResponseItemAnswer = {
  Schema: QuestionnaireResponseItemAnswerSchema,
}

export interface QuestionnaireResponseItem extends BackboneElement<QuestionnaireResponseItemId> {
  definition?: string
  linkId: QuestionnaireItemLink
  text?: string
  item?: QuestionnaireResponseItem[]
  answer?: QuestionnaireResponseItemAnswer[]
}

/**
 * Groups cannot have answers and therefore must nest directly within item.
 * When dealing with questions, nesting must occur within each answer because
 * some questions may have multiple answers (and the nesting occurs for each answer).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const QuestionnaireResponseItemSchema: Schema.Schema<
  QuestionnaireResponseItem,
  any,
  never
> = Schema.extend(
  BackboneElement.Schema(QuestionnaireResponseItemId),
  Schema.Struct({
    definition: Schema.optional(Schema.String),
    linkId: QuestionnaireItemLink,
    text: Schema.optional(Schema.String),
    item: Schema.optional(
      Schema.mutable(Schema.Array(
        Schema.suspend(
          () => QuestionnaireResponseItemSchema
        )
      ))
    ),
    answer: Schema.optional(
      Schema.mutable(Schema.Array(
        Schema.suspend(
          () => QuestionnaireResponseItemAnswerSchema
        )
      ))
    ),
  })
)

export const QuestionnaireResponseItem = {
  Schema: QuestionnaireResponseItemSchema,
}

export function* allQuestionnaireResponseItems(
  items: QuestionnaireResponseItem[]
): Generator<QuestionnaireResponseItem> {
  for (const child of items) {
    yield child
    if (child.item) yield* allQuestionnaireResponseItems(child.item)
  }
}
