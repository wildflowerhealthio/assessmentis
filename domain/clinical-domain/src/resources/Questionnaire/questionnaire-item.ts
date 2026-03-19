import { Schema, pipe } from 'effect'
import type { FastCheck } from 'effect'

import {
  AnnotateArrayWithArbitrary,
  MergeClasses,
  makeCloneWith,
  mergeArbitraries,
} from '@assessmentis/util'

import { BackboneElement, Coding } from '../../data-types'
import type { BackboneElementEncoded } from '../../data-types'
import { QuestionnaireItemAnswerOption } from './questionnaire-item-answer-option'
import { QuestionnaireItemLink } from './questionnaire-item-link'

/** Union of FHIR R4 questionnaire item type codes. */
export type QuestionItemType =
  | 'group'
  | 'display'
  | 'question'
  | 'boolean'
  | 'decimal'
  | 'integer'
  | 'date'
  | 'dateTime'
  | 'time'
  | 'string'
  | 'text'
  | 'url'
  | 'choice'
  | 'open-choice'
  | 'attachment'
  | 'reference'
  | 'quantity'

/** FHIR R4 questionnaire item type — controls the expected answer format (group, display, boolean, string, choice, etc.). */
export const QuestionItemType = Schema.Union(
  Schema.Literal('group'),
  Schema.Literal('display'),
  Schema.Literal('question'),
  Schema.Literal('boolean'),
  Schema.Literal('decimal'),
  Schema.Literal('integer'),
  Schema.Literal('date'),
  Schema.Literal('dateTime'),
  Schema.Literal('time'),
  Schema.Literal('string'),
  Schema.Literal('text'),
  Schema.Literal('url'),
  Schema.Literal('choice'),
  Schema.Literal('open-choice'),
  Schema.Literal('attachment'),
  Schema.Literal('reference'),
  Schema.Literal('quantity')
)

const questionnaireItemFields = {
  answerOption: Schema.optional(
    Schema.Array(QuestionnaireItemAnswerOption).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  answerValueSet: Schema.optional(Schema.String),
  code: Schema.optional(
    Schema.Array(Schema.suspend(() => Coding)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  definition: Schema.optional(Schema.String),
  enableBehavior: Schema.optional(
    Schema.Union(Schema.Literal('all'), Schema.Literal('any'), Schema.Undefined)
  ),
  enableWhen: Schema.optional(Schema.Any),
  initial: Schema.optional(Schema.Any),
  linkId: QuestionnaireItemLink,
  maxLength: Schema.optional(Schema.Int),
  prefix: Schema.optional(Schema.String),
  readOnly: Schema.optional(Schema.Boolean),
  repeats: Schema.optional(Schema.Boolean),
  required: Schema.optional(Schema.Boolean),
  text: Schema.optional(Schema.String),
  type: QuestionItemType,
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of a {@link QuestionnaireItem}, including recursive nested items. */
export interface QuestionnaireItemEncoded
  extends
    Schema.Struct.Encoded<typeof questionnaireItemFields>,
    BackboneElementEncoded<'QuestionnaireItem'> {
  item?: readonly QuestionnaireItemEncoded[] | undefined
}

const BackboneElementMixin = BackboneElement('QuestionnaireItem')
/**
 * The content of the questionnaire is constructed from an ordered,
 * hierarchical collection of items.
 */
export class QuestionnaireItem extends MergeClasses<QuestionnaireItem>('QuestionnaireItem')(
  [
    {
      arbitrary:
        () =>
        (fc: typeof FastCheck): FastCheck.Arbitrary<QuestionnaireItem> =>
          fc.letrec<{ self: QuestionnaireItem }>((tie) => ({
            self: mergeArbitraries(
              (props) => new QuestionnaireItem(props),
              questionnaireItemFields,
              BackboneElementMixin,
              (
                fc
              ): FastCheck.Arbitrary<{
                item: readonly QuestionnaireItem[] | undefined
              }> =>
                fc.record({
                  item: fc.oneof(
                    {
                      depthIdentifier: 'id:QuestionnaireItem',
                      depthSize: 'small',
                    },
                    fc.constant<readonly never[]>([]),
                    fc.constant<readonly never[]>([]),
                    fc.array<QuestionnaireItem>(tie('self'), {
                      depthIdentifier: 'id:self',
                      maxLength: 2,
                    })
                  ),
                })
            )(fc),
          })).self,
    },
  ],
  BackboneElementMixin,
  {
    ...questionnaireItemFields,
    item: Schema.optional(
      pipe(
        Schema.Array(
          Schema.suspend(
            (): Schema.Schema<QuestionnaireItem, QuestionnaireItemEncoded> => QuestionnaireItem
          )
        )
      )
    ),
  }
) {
  readonly cloneWith = makeCloneWith(QuestionnaireItem, this)
}
