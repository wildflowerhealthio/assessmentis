import { Schema } from 'effect'
import type {
  Questionnaire as FhirQuestionnaire,
  QuestionnaireItem as FhirQuestionnaireItem,
  QuestionnaireItemAnswerOption as FhirQuestionnaireItemAnswerOption,
} from 'fhir/r4'
import type { DomainResource } from '../../../data-types/base/DomainResource'
import { DomainResourceFromFhirR4 } from '../../../data-types/base/DomainResource'
import type { BackboneElement } from '../../../data-types/base/BackboneElement'
import { BackboneElementFromFhirR4 } from '../../../data-types/base/BackboneElement'
import type { Coding } from '../../../data-types/complex/Coding'
import { Coding as CodingSchema } from '../../../data-types/complex/Coding'
import type { DeepReadonly } from '@assessmentis/util'
import {
  ValueElementFromFhirR4,
  type ValueElement,
} from '../../../data-types/primitive/ValueElement'

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

const QuestionnaireItemAnswerOptionFromFhirR4: Schema.Schema<
  QuestionnaireItemAnswerOption,
  DeepReadonly<FhirQuestionnaireItemAnswerOption>,
  never
> = Schema.extend(
  Schema.extend(
    BackboneElementFromFhirR4(QuestionnaireItemAnswerOptionId),
    ValueElementFromFhirR4
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
  answerOption?: ReadonlyArray<QuestionnaireItemAnswerOption>
  answerValueSet?: string
  code?: ReadonlyArray<Coding>
  definition?: string
  enableBehavior?: 'all' | 'any'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enableWhen?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initial?: any
  item?: ReadonlyArray<QuestionnaireItem>
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
export const QuestionnaireItemFromFhirR4: Schema.Schema<
  QuestionnaireItem,
  DeepReadonly<FhirQuestionnaireItem>,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(QuestionnaireItemId),
  Schema.Struct({
    answerOption: Schema.optional(
      Schema.Array(QuestionnaireItemAnswerOptionFromFhirR4)
    ),
    answerValueSet: Schema.optional(Schema.String),
    code: Schema.optional(Schema.Array(Schema.suspend(() => CodingSchema))),
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
      Schema.Array(
        Schema.suspend(
          (): Schema.Schema<
            QuestionnaireItem,
            DeepReadonly<FhirQuestionnaireItem>,
            never
          > => QuestionnaireItemFromFhirR4
        )
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

/**
 * A structured set of questions intended to guide the collection of answers
 * from end-users. Questionnaires provide detailed control over order,
 * presentation, phraseology and grouping to allow coherent, consistent
 * data collection.
 */
export interface Questionnaire extends DomainResource<QuestionnaireId> {
  resourceType: 'Questionnaire'
  approvalDate?: string
  code?: ReadonlyArray<Coding>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contact?: any
  copyright?: string
  date?: string
  derivedFrom?: ReadonlyArray<string>
  description?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  effectivePeriod?: any
  experimental?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  identifier?: any
  item?: ReadonlyArray<QuestionnaireItem>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jurisdiction?: any
  lastReviewDate?: string
  name?: string
  publisher?: string
  purpose?: string
  status: 'draft' | 'active' | 'retired' | 'unknown'
  subjectType?: ReadonlyArray<string>
  title?: string
  url?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useContext?: any
  version?: string
}

export const QuestionnaireFromFhirR4: Schema.Schema<
  Questionnaire,
  DeepReadonly<FhirQuestionnaire>,
  never
> = Schema.extend(
  DomainResourceFromFhirR4(QuestionnaireId),
  Schema.Struct({
    resourceType: Schema.Literal('Questionnaire'),
    approvalDate: Schema.optional(Schema.String),
    code: Schema.optional(Schema.Array(Schema.suspend(() => CodingSchema))),
    contact: Schema.optional(Schema.Any),
    copyright: Schema.optional(Schema.String),
    date: Schema.optional(Schema.String),
    derivedFrom: Schema.optional(Schema.Array(Schema.String)),
    description: Schema.optional(Schema.String),
    effectivePeriod: Schema.optional(Schema.Any),
    experimental: Schema.optional(Schema.Boolean),
    identifier: Schema.optional(Schema.Any),
    item: Schema.optional(Schema.Array(QuestionnaireItemFromFhirR4)),
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
    url: Schema.optional(Schema.String),
    useContext: Schema.optional(Schema.Any),
    version: Schema.optional(Schema.String),
  })
)
