import { Schema } from 'effect'
import {
  Coding,
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types'
import { QuestionnaireItemAnswerOption } from './QuestionnaireItemAnswerOption'
import { QuestionnaireItemLink } from './QuestionnaireItemLink'

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
  code: Schema.optional(Schema.Array(Schema.suspend(() => Coding.Coding))),
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

/**
 * The content of the questionnaire is constructed from an ordered,
 * hierarchical collection of items.
 */
export class QuestionnaireItem extends BackboneElement(
  'QuestionnaireItem'
).extend<QuestionnaireItem>('QuestionnaireItem')({
  ...questionnaireItemFields,
  item: Schema.optional(
    Schema.Array(
      Schema.suspend(
        (): Schema.Schema<QuestionnaireItem, QuestionnaireItemEncoded> =>
          QuestionnaireItem
      )
    )
  ),
}) {}
