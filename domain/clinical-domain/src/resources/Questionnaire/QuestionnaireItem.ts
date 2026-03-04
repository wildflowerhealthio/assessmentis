import type { FastCheck } from 'effect'
import { pipe, Schema } from 'effect'
import {
  Coding,
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types'
import { QuestionnaireItemAnswerOption } from './QuestionnaireItemAnswerOption'
import { QuestionnaireItemLink } from './QuestionnaireItemLink'
import { mergeArbitraries, MergeClasses } from '@assessmentis/util'

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
  answerOption: Schema.optional(Schema.Array(QuestionnaireItemAnswerOption)),
  answerValueSet: Schema.optional(Schema.String),
  code: Schema.optional(Schema.Array(Schema.suspend(() => Coding))),
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

export interface QuestionnaireItemEncoded
  extends
    Schema.Struct.Encoded<typeof questionnaireItemFields>,
    BackboneElementEncoded<'QuestionnaireItem'> {
  item?: ReadonlyArray<QuestionnaireItemEncoded> | undefined
}

const BackboneElementMixin = BackboneElement('QuestionnaireItem')
/**
 * The content of the questionnaire is constructed from an ordered,
 * hierarchical collection of items.
 */
export class QuestionnaireItem extends MergeClasses<QuestionnaireItem>(
  'QuestionnaireItem'
)(
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
                item: ReadonlyArray<QuestionnaireItem> | undefined
              }> =>
                fc.record({
                  item: fc.oneof(
                    {
                      depthSize: 'small',
                      depthIdentifier: 'id:QuestionnaireItem',
                    },
                    fc.constant<ReadonlyArray<never>>([]),
                    fc.constant<ReadonlyArray<never>>([]),
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
            (): Schema.Schema<QuestionnaireItem, QuestionnaireItemEncoded> =>
              QuestionnaireItem
          )
        )
      )
    ),
  }
) {}
