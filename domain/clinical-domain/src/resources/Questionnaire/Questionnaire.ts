import { Schema } from 'effect'
import { MergeClasses } from '@assessmentis/util'
import { Resource, type ResourceEncoded } from '../../data-types/base/Resource'
import { Coding } from '../../data-types/complex/Coding'
import { QuestionnaireItem } from './QuestionnaireItem'

const Key = 'Questionnaire' as const
type Key = typeof Key

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
  [],
  resourceMixin,
  fields
) {}
