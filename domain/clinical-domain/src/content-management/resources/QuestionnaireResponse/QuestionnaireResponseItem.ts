import { Schema } from 'effect'
import type {
  QuestionnaireResponseItem as FhirQuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer as FhirQuestionnaireResponseItemAnswer,
} from 'fhir/r4'
import { QuestionnaireItemLink } from '../Questionnaire/Questionnaire'
import type { BackboneElement } from '../../../data-types/base/BackboneElement'
import { BackboneElementFromFhirR4 } from '../../../data-types/base/BackboneElement'
import type { ValueElement } from '../../../data-types/primitive/ValueElement'
import { ValueElementFromFhirR4 } from '../../../data-types/primitive/ValueElement'
import type { DeepReadonly } from '@assessmentis/util'

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
  item?: ReadonlyArray<QuestionnaireResponseItem>
}

/**
 * The value is nested because we cannot have a repeating structure that has variable type.
 */
export const QuestionnaireResponseItemAnswerFromFhirR4: Schema.Schema<
  QuestionnaireResponseItemAnswer,
  DeepReadonly<FhirQuestionnaireResponseItemAnswer>,
  never
> = Schema.extend(
  Schema.extend(
    BackboneElementFromFhirR4(QuestionnaireResponseItemAnswerId),
    Schema.Struct({
      item: Schema.optional(
        Schema.Array(
          Schema.suspend(
            (): Schema.Schema<
              QuestionnaireResponseItem,
              DeepReadonly<FhirQuestionnaireResponseItem>,
              never
            > => QuestionnaireResponseItemFromFhirR4
          )
        )
      ),
    })
  ),
  Schema.suspend(() => ValueElementFromFhirR4)
)

export interface QuestionnaireResponseItem extends BackboneElement<QuestionnaireResponseItemId> {
  definition?: string
  linkId: QuestionnaireItemLink
  text?: string
  item?: ReadonlyArray<QuestionnaireResponseItem>
  answer?: ReadonlyArray<QuestionnaireResponseItemAnswer>
}

/**
 * Groups cannot have answers and therefore must nest directly within item.
 * When dealing with questions, nesting must occur within each answer because
 * some questions may have multiple answers (and the nesting occurs for each answer).
 */
export const QuestionnaireResponseItemFromFhirR4: Schema.Schema<
  QuestionnaireResponseItem,
  DeepReadonly<FhirQuestionnaireResponseItem>,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(QuestionnaireResponseItemId),
  Schema.Struct({
    definition: Schema.optional(Schema.String),
    linkId: QuestionnaireItemLink,
    text: Schema.optional(Schema.String),
    item: Schema.optional(
      Schema.Array(
        Schema.suspend(
          (): Schema.Schema<
            QuestionnaireResponseItem,
            DeepReadonly<FhirQuestionnaireResponseItem>,
            never
          > => QuestionnaireResponseItemFromFhirR4
        )
      )
    ),
    answer: Schema.optional(
      Schema.Array(
        Schema.suspend(
          (): Schema.Schema<
            QuestionnaireResponseItemAnswer,
            DeepReadonly<FhirQuestionnaireResponseItemAnswer>,
            never
          > => QuestionnaireResponseItemAnswerFromFhirR4
        )
      )
    ),
  })
)

export function* allQuestionnaireResponseItems(
  items: ReadonlyArray<QuestionnaireResponseItem>
): Generator<QuestionnaireResponseItem> {
  for (const child of items) {
    yield child
    if (child.item) yield* allQuestionnaireResponseItems(child.item)
  }
}
