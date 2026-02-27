import { Schema } from 'effect'
import { MergeClasses } from '@assessmentis/util'
import {
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types/base/BackboneElement'
import { Resource, type ResourceEncoded } from '../../data-types/base/Resource'
import { Coding } from '../../data-types/complex/Coding'
import { DatatypeChoice } from '../../data-types/Datatype'
import FhirR4ChoiceElements from '../../data-types/fhirR4ChoiceElements'

const Key = 'Questionnaire' as const
type Key = typeof Key

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

const QuestionItemType = Schema.Union(
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

export const QuestionnaireItemLink = Schema.String.pipe(
  Schema.brand('QuestionnaireItemLink')
)

export type QuestionnaireItemLink = typeof QuestionnaireItemLink.Type

const answerOptionValueMixin = DatatypeChoice(
  'value',
  FhirR4ChoiceElements['Questionnaire.item.answerOption.value[x]']
)
const QuestionnaireItemAnswerOptionBackbone = BackboneElement(
  'QuestionnaireItemAnswerOption'
)
export class QuestionnaireItemAnswerOption extends MergeClasses<QuestionnaireItemAnswerOption>(
  'QuestionnaireItemAnswerOption'
)(QuestionnaireItemAnswerOptionBackbone, answerOptionValueMixin, {
  initialSelected: Schema.optional(Schema.Boolean),
}) {}

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

/**
 * The content of the questionnaire is constructed from an ordered,
 * hierarchical collection of items.
 */
export class QuestionnaireItem extends Schema.Class<QuestionnaireItem>(
  'QuestionnaireItem'
)({
  ...BackboneElement('QuestionnaireItem').fields,
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

// --- Questionnaire ---

const fields = {
  definitionUrl: Schema.optional(Schema.String),
  approvalDate: Schema.optional(Schema.String),
  code: Schema.optional(Schema.Array(Schema.suspend(() => Coding))),
  contact: Schema.optional(Schema.Any),
  copyright: Schema.optional(Schema.String),
  date: Schema.optional(Schema.String),
  derivedFrom: Schema.optional(Schema.Array(Schema.String)),
  description: Schema.optional(Schema.String),
  effectivePeriod: Schema.optional(Schema.Any),
  experimental: Schema.optional(Schema.Boolean),
  identifier: Schema.optional(Schema.Any),
  item: Schema.optional(Schema.Array(QuestionnaireItem)),
  jurisdiction: Schema.optional(Schema.Any),
  lastReviewDate: Schema.optional(Schema.String),
  name: Schema.optional(Schema.String),
  publisher: Schema.optional(Schema.String),
  purpose: Schema.optional(Schema.String),
  status: Schema.Union(
    Schema.Literal('draft'),
    Schema.Literal('active'),
    Schema.Literal('retired'),
    Schema.Literal('unknown')
  ),
  subjectType: Schema.optional(Schema.Array(Schema.String)),
  title: Schema.optional(Schema.String),
  useContext: Schema.optional(Schema.Any),
  version: Schema.optional(Schema.String),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(Key)

export interface QuestionnaireEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<Key> {}

/**
 * A structured set of questions intended to guide the collection of answers
 * from end-users. Questionnaires provide detailed control over order,
 * presentation, phraseology and grouping to allow coherent, consistent
 * data collection.
 */
export class Questionnaire extends MergeClasses<Questionnaire>(Key)(
  resourceMixin,
  fields
) {}
