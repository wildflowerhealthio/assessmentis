import { Schema, pipe } from 'effect'
import type { Arbitrary, FastCheck } from 'effect'

import { makeCloneWith } from '@assessmentis/util'

import { BackboneElement } from '../../data-types/base/backbone-element'
import type { BackboneElementEncoded } from '../../data-types/base/backbone-element'
import { DatatypeChoice } from '../../data-types/datatype'
import FhirR4ChoiceElements from '../../data-types/fhir-r4-choice-elements'
import { QuestionnaireItemLink } from '../Questionnaire/questionnaire-item-link'

const questionnaireResponseItemAnswerFields = {
  value: pipe(
    Schema.UndefinedOr(
      DatatypeChoice(FhirR4ChoiceElements['QuestionnaireResponse.item.answer.value[x]'])
    ),
    Schema.annotations({
      arbitrary: (): Arbitrary.LazyArbitrary<undefined> => (fc: typeof FastCheck) =>
        fc.constant(undefined),
    }),
    Schema.optionalWith({ default: () => undefined })
  ),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of a {@link QuestionnaireResponseItemAnswer}, including recursive items. */
export interface QuestionnaireResponseItemAnswerEncoded
  extends
    Schema.Struct.Encoded<typeof questionnaireResponseItemAnswerFields>,
    BackboneElementEncoded<'QuestionnaireResponseItemAnswer'> {
  item?: readonly QuestionnaireResponseItemEncoded[] | undefined
}

const QuestionnaireResponseItemAnswerBackboneElement = BackboneElement(
  'QuestionnaireResponseItemAnswer'
)
/**
 * The value is nested because we cannot have a repeating structure that has variable type.
 */
export class QuestionnaireResponseItemAnswer extends QuestionnaireResponseItemAnswerBackboneElement.extend<QuestionnaireResponseItemAnswer>(
  'QuestionnaireResponseItemAnswer'
)(
  {
    ...questionnaireResponseItemAnswerFields,

    item: Schema.optional(
      pipe(
        Schema.Array(
          Schema.suspend(
            (): Schema.Schema<QuestionnaireResponseItem, QuestionnaireResponseItemEncoded> =>
              QuestionnaireResponseItem
          )
        )
      )
    ),
  }
) {
  static DomainType = QuestionnaireResponseItemAnswerBackboneElement.DomainType
  static UrlSchema = QuestionnaireResponseItemAnswerBackboneElement.UrlSchema
}

const questionnaireResponseItemFields = {
  definition: Schema.optional(Schema.String),
  linkId: QuestionnaireItemLink,
  text: Schema.optional(Schema.String),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of a {@link QuestionnaireResponseItem}, including recursive items and answers. */
export interface QuestionnaireResponseItemEncoded
  extends
    Schema.Struct.Encoded<typeof questionnaireResponseItemFields>,
    BackboneElementEncoded<'QuestionnaireResponseItem'> {
  item?: readonly QuestionnaireResponseItemEncoded[] | undefined
  answer?: readonly QuestionnaireResponseItemAnswerEncoded[] | undefined
}

const QuestionnaireResponseItemBackboneElement = BackboneElement('QuestionnaireResponseItem')
/**
 * Groups cannot have answers and therefore must nest directly within item.
 * When dealing with questions, nesting must occur within each answer because
 * some questions may have multiple answers (and the nesting occurs for each answer).
 */
export class QuestionnaireResponseItem extends QuestionnaireResponseItemBackboneElement.extend<QuestionnaireResponseItem>(
  'QuestionnaireResponseItem'
)(
  {
    ...questionnaireResponseItemFields,
    answer: Schema.optional(
      pipe(
        Schema.Array(
          Schema.suspend(
            (): Schema.Schema<
              QuestionnaireResponseItemAnswer,
              QuestionnaireResponseItemAnswerEncoded
            > => QuestionnaireResponseItemAnswer
          )
        )
      )
    ),
    item: Schema.optional(
      pipe(
        Schema.Array(
          Schema.suspend(
            (): Schema.Schema<QuestionnaireResponseItem, QuestionnaireResponseItemEncoded> =>
              QuestionnaireResponseItem
          )
        )
      )
    ),
  }
) {
  static DomainType = QuestionnaireResponseItemBackboneElement.DomainType
  static UrlSchema = QuestionnaireResponseItemBackboneElement.UrlSchema
  readonly cloneWith = makeCloneWith(QuestionnaireResponseItem, this);

  /** Yields all nested child {@link QuestionnaireResponseItem}s depth-first. */
  *deepQuestionnaireResponseItems(): Generator<QuestionnaireResponseItem> {
    for (const child of this.item ?? []) {
      yield child
      yield* child.deepQuestionnaireResponseItems()
    }
  }

  /** Returns a copy with the child item matching `linkId` replaced (or inserted) by applying `updater`. */
  withChildItem(
    linkId: typeof QuestionnaireItemLink.Type,
    updater: (prev: QuestionnaireResponseItem) => QuestionnaireResponseItem
  ): QuestionnaireResponseItem {
    const existing =
      this.item?.find((i) => i.linkId === linkId) ?? QuestionnaireResponseItem.make({ linkId })
    const updated = updater(existing)
    return this.cloneWith({
      item: [...(this.item?.filter((i) => i.linkId !== linkId) ?? []), updated],
    })
  }
}
