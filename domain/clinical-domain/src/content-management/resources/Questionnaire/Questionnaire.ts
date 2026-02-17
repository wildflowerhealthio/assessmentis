import { Schema } from 'effect'
import { ClinicalResourceBehaviourImpl } from '../../../ClinicalResourceBehaviour'
import { DomainResource } from '../../../data-types/base/DomainResource'
import { BackboneElement } from '../../../data-types/base/BackboneElement'
import { Coding } from '../../../data-types/complex/Coding'
import { ValueElement } from '../../../data-types/primitive/ValueElement'

const TypeId: unique symbol = Symbol.for(
  '@assessmentis/clinical-domain/Questionnaire'
)
type TypeId = typeof TypeId

export const QuestionnaireId = Schema.String.pipe(
  Schema.brand('QuestionnaireId')
)

export type QuestionnaireId = typeof QuestionnaireId.Type

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

export const QuestionnaireItemId = Schema.String.pipe(
  Schema.brand('QuestionnaireItemId')
)
export type QuestionnaireItemId = typeof QuestionnaireItemId.Type

const QuestionnaireItemAnswerOptionId = Schema.String.pipe(
  Schema.brand('QuestionnaireItemAnswerOptionId')
)
type QuestionnaireItemAnswerOptionId =
  typeof QuestionnaireItemAnswerOptionId.Type

export interface QuestionnaireItemAnswerOption
  extends ValueElement, BackboneElement<QuestionnaireItemAnswerOptionId> {
  initialSelected?: boolean
}

const QuestionnaireItemAnswerOptionSchema = Schema.extend(
  Schema.extend(
    BackboneElement.Schema(QuestionnaireItemAnswerOptionId),
    ValueElement.Schema
  ),
  Schema.Struct({
    initialSelected: Schema.optional(Schema.Boolean),
  })
)

/**
 * The content of the questionnaire is constructed from an ordered,
 * hierarchical collection of items.
 */
export interface QuestionnaireItem extends BackboneElement<QuestionnaireItemId> {
  answerOption?: QuestionnaireItemAnswerOption[]
  answerValueSet?: string
  code?: Coding[]
  definition?: string
  enableBehavior?: 'all' | 'any'
  enableWhen?: unknown
  initial?: unknown
  item?: QuestionnaireItem[]
  linkId: QuestionnaireItemLink
  maxLength?: number
  prefix?: string
  readOnly?: boolean
  repeats?: boolean
  required?: boolean
  text?: string
  type: QuestionItemType
}

/**
 * The content of the questionnaire is constructed from an ordered,
 * hierarchical collection of items.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const QuestionnaireItemSchema: Schema.Schema<QuestionnaireItem, any, never> =
  Schema.extend(
    BackboneElement.Schema(QuestionnaireItemId),
    Schema.Struct({
      answerOption: Schema.optional(
        Schema.mutable(Schema.Array(QuestionnaireItemAnswerOptionSchema))
      ),
      answerValueSet: Schema.optional(Schema.String),
      code: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Coding.Schema)))
      ),
      definition: Schema.optional(Schema.String),
      enableBehavior: Schema.optional(
        Schema.Union(
          Schema.Literal('all'),
          Schema.Literal('any'),
          Schema.Undefined
        )
      ),
      enableWhen: Schema.optional(Schema.Any),
      initial: Schema.optional(Schema.Any),
      item: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => QuestionnaireItemSchema))
        )
      ),
      linkId: QuestionnaireItemLink,
      maxLength: Schema.optional(Schema.Int),
      prefix: Schema.optional(Schema.String),
      readOnly: Schema.optional(Schema.Boolean),
      repeats: Schema.optional(Schema.Boolean),
      required: Schema.optional(Schema.Boolean),
      text: Schema.optional(Schema.String),
      type: QuestionItemType,
    })
  )

export const QuestionnaireItem = { Schema: QuestionnaireItemSchema }

/**
 * A structured set of questions intended to guide the collection of answers
 * from end-users. Questionnaires provide detailed control over order,
 * presentation, phraseology and grouping to allow coherent, consistent
 * data collection.
 */
export interface Questionnaire extends DomainResource<QuestionnaireId> {
  resourceType: 'Questionnaire'
  approvalDate?: string
  code?: Coding[]
  contact?: unknown
  copyright?: string
  date?: string
  derivedFrom?: string[]
  description?: string
  effectivePeriod?: unknown
  experimental?: boolean
  identifier?: unknown
  item?: QuestionnaireItem[]
  jurisdiction?: unknown
  lastReviewDate?: string
  name?: string
  publisher?: string
  purpose?: string
  status: 'draft' | 'active' | 'retired' | 'unknown'
  subjectType?: string[]
  title?: string
  url?: string
  useContext?: unknown
  version?: string
}

export const Questionnaire = ClinicalResourceBehaviourImpl({
  TypeId,
  resourceType: 'Questionnaire',
  Schema: Schema.extend(
    DomainResource.Schema(QuestionnaireId),
    Schema.Struct({
      resourceType: Schema.Literal('Questionnaire'),
      approvalDate: Schema.optional(Schema.String),
      code: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Coding.Schema)))
      ),
      contact: Schema.optional(Schema.Any),
      copyright: Schema.optional(Schema.String),
      date: Schema.optional(Schema.String),
      derivedFrom: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
      description: Schema.optional(Schema.String),
      effectivePeriod: Schema.optional(Schema.Any),
      experimental: Schema.optional(Schema.Boolean),
      identifier: Schema.optional(Schema.Any),
      item: Schema.optional(
        Schema.mutable(Schema.Array(QuestionnaireItemSchema))
      ),
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
      subjectType: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
      title: Schema.optional(Schema.String),
      url: Schema.optional(Schema.String),
      useContext: Schema.optional(Schema.Any),
      version: Schema.optional(Schema.String),
    })
  ),
})
