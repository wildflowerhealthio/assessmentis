import { Schema } from 'effect'

import { AnnotateArrayWithArbitrary, MergeClasses } from '@assessmentis/util'

import { Resource } from '../../data-types/base/Resource'
import type { ResourceEncoded } from '../../data-types/base/Resource'
import { Coding } from '../../data-types/complex/Coding'
import { QuestionnaireItem } from './QuestionnaireItem'

const DomainType = 'Questionnaire' as const
type DomainType = typeof DomainType

// --- Questionnaire ---

const fields = {
  definitionUrl: Schema.optional(Schema.String),
  approvalDate: Schema.optional(Schema.String),
  code: Schema.optional(
    Schema.Array(Schema.suspend(() => Coding)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  contact: Schema.optional(Schema.Any),
  copyright: Schema.optional(Schema.String),
  date: Schema.optional(Schema.String),
  derivedFrom: Schema.optional(
    Schema.Array(Schema.String).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  description: Schema.optional(Schema.String),
  effectivePeriod: Schema.optional(Schema.Any),
  experimental: Schema.optional(Schema.Boolean),
  identifier: Schema.optional(Schema.Any),
  item: Schema.optional(
    Schema.Array(QuestionnaireItem).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
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
  subjectType: Schema.optional(
    Schema.Array(Schema.String).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  title: Schema.optional(Schema.String),
  useContext: Schema.optional(Schema.Any),
  version: Schema.optional(Schema.String),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(DomainType)

/** Encoded (wire-format) shape of a {@link Questionnaire}. */
export interface QuestionnaireEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {}

/**
 * A structured set of questions intended to guide the collection of answers
 * from end-users. Questionnaires provide detailed control over order,
 * presentation, phraseology and grouping to allow coherent, consistent
 * data collection.
 */
export class Questionnaire extends MergeClasses<Questionnaire>(DomainType)(
  [],
  resourceMixin,
  fields
) {}
