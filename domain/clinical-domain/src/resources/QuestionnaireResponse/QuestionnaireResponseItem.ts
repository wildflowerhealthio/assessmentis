import { pipe, Schema, type FastCheck } from 'effect'

import { mergeArbitraries, MergeClasses } from '@assessmentis/util'

import {
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types/base/BackboneElement'
import { DatatypeChoice } from '../../data-types/Datatype'
import FhirR4ChoiceElements from '../../data-types/fhirR4ChoiceElements'
import { QuestionnaireItemLink } from '../Questionnaire/QuestionnaireItemLink'

const questionnaireResponseItemAnswerFields = {
  value: Schema.optional(
    DatatypeChoice(
      FhirR4ChoiceElements['QuestionnaireResponse.item.answer.value[x]']
    )
  ),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of a {@link QuestionnaireResponseItemAnswer}, including recursive items. */
export interface QuestionnaireResponseItemAnswerEncoded
  extends
    Schema.Struct.Encoded<typeof questionnaireResponseItemAnswerFields>,
    BackboneElementEncoded<'QuestionnaireResponseItemAnswer'> {
  item?: ReadonlyArray<QuestionnaireResponseItemEncoded> | undefined
}

const AnswerBackboneElementMixin = BackboneElement(
  'QuestionnaireResponseItemAnswer'
)
/**
 * The value is nested because we cannot have a repeating structure that has variable type.
 */
export class QuestionnaireResponseItemAnswer extends MergeClasses<QuestionnaireResponseItemAnswer>(
  'QuestionnaireResponseItemAnswer'
)(
  [
    {
      arbitrary:
        () =>
        (
          fc: typeof FastCheck
        ): FastCheck.Arbitrary<QuestionnaireResponseItemAnswer> =>
          qrLetrec(fc).answer,
    },
  ],
  AnswerBackboneElementMixin,
  {
    ...questionnaireResponseItemAnswerFields,

    item: Schema.optional(
      pipe(
        Schema.Array(
          Schema.suspend(
            (): Schema.Schema<
              QuestionnaireResponseItem,
              QuestionnaireResponseItemEncoded
            > => QuestionnaireResponseItem
          )
        )
      )
    ),
  }
) {}

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
  item?: ReadonlyArray<QuestionnaireResponseItemEncoded> | undefined
  answer?: ReadonlyArray<QuestionnaireResponseItemAnswerEncoded> | undefined
}

const ItemBackboneElementMixin = BackboneElement('QuestionnaireResponseItem')
/**
 * Groups cannot have answers and therefore must nest directly within item.
 * When dealing with questions, nesting must occur within each answer because
 * some questions may have multiple answers (and the nesting occurs for each answer).
 */
export class QuestionnaireResponseItem extends MergeClasses<QuestionnaireResponseItem>(
  'QuestionnaireResponseItem'
)(
  [
    {
      arbitrary:
        () =>
        (
          fc: typeof FastCheck
        ): FastCheck.Arbitrary<QuestionnaireResponseItem> =>
          qrLetrec(fc).item,
    },
  ],
  ItemBackboneElementMixin,
  {
    ...questionnaireResponseItemFields,
    item: Schema.optional(
      pipe(
        Schema.Array(
          Schema.suspend(
            (): Schema.Schema<
              QuestionnaireResponseItem,
              QuestionnaireResponseItemEncoded
            > => QuestionnaireResponseItem
          )
        )
      )
    ),
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
  }
) {
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
      this.item?.find((i) => i.linkId === linkId) ??
      QuestionnaireResponseItem.make({ linkId })
    const updated = updater(existing)
    return QuestionnaireResponseItem.make({
      ...this,
      item: [...(this.item?.filter((i) => i.linkId !== linkId) ?? []), updated],
    })
  }
}

/** Shared letrec for mutually recursive QRItem/QRItemAnswer arbitrary generation */
const qrLetrec = (fc: typeof FastCheck) =>
  fc.letrec<{
    item: QuestionnaireResponseItem
    answer: QuestionnaireResponseItemAnswer
  }>((tie) => ({
    item: mergeArbitraries(
      (props) => new QuestionnaireResponseItem(props),
      questionnaireResponseItemFields,
      ItemBackboneElementMixin,
      (
        fc
      ): FastCheck.Arbitrary<{
        item: ReadonlyArray<QuestionnaireResponseItem> | undefined
        answer: ReadonlyArray<QuestionnaireResponseItemAnswer> | undefined
      }> =>
        fc.record({
          item: fc.oneof(
            {
              depthSize: 'small',
              depthIdentifier: 'id:QRItem',
            },
            fc.constant<ReadonlyArray<never>>([]),
            fc.constant<ReadonlyArray<never>>([]),
            fc.array<QuestionnaireResponseItem>(tie('item'), {
              depthIdentifier: 'id:QRItem',
              maxLength: 2,
            })
          ),
          answer: fc.oneof(
            {
              depthSize: 'small',
              depthIdentifier: 'id:QRItemAnswer',
            },
            fc.constant<ReadonlyArray<never>>([]),
            fc.constant<ReadonlyArray<never>>([]),
            fc.array<QuestionnaireResponseItemAnswer>(tie('answer'), {
              depthIdentifier: 'id:QRItemAnswer',
              maxLength: 2,
            })
          ),
        })
    )(fc),
    answer: mergeArbitraries(
      (props) => new QuestionnaireResponseItemAnswer(props),
      questionnaireResponseItemAnswerFields,
      AnswerBackboneElementMixin,
      (
        fc
      ): FastCheck.Arbitrary<{
        item: ReadonlyArray<QuestionnaireResponseItem> | undefined
      }> =>
        fc.record({
          item: fc.oneof(
            {
              depthSize: 'small',
              depthIdentifier: 'id:QRItem',
            },
            fc.constant<ReadonlyArray<never>>([]),
            fc.constant<ReadonlyArray<never>>([]),
            fc.array<QuestionnaireResponseItem>(tie('item'), {
              depthIdentifier: 'id:QRItem',
              maxLength: 2,
            })
          ),
        })
    )(fc),
  }))
