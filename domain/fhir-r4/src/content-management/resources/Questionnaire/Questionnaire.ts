import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { FhirR4ResourceBehaviourImpl } from '../../../FhirR4ResourceBehaviour'
import type {
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireItemAnswerOption,
} from '@assessmentis/clinical-domain/content-management'
import {
  QuestionnaireId,
  QuestionnaireItemId,
  QuestionnaireItemLink,
} from '@assessmentis/clinical-domain/content-management'
import { FhirR4DomainResource } from '../../../data-types/base/DomainResource'
import { FhirR4BackboneElement } from '../../../data-types/base/BackboneElement'
import { FhirR4Coding } from '../../../data-types/complex/Coding'
import { FhirR4ValueElement } from '../../../data-types/primitive/ValueElement'

// --- Sub-component IDs ---

const QuestionnaireItemAnswerOptionId = Schema.String.pipe(
  Schema.brand('QuestionnaireItemAnswerOptionId')
)

// --- Value sets ---

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

// --- Sub-component schemas ---

const FhirR4QuestionnaireItemAnswerOptionSchema: Schema.Schema<
  QuestionnaireItemAnswerOption,
  FhirR4.QuestionnaireItemAnswerOption,
  never
> = Schema.extend(
  Schema.extend(
    FhirR4BackboneElement.Schema(QuestionnaireItemAnswerOptionId),
    FhirR4ValueElement.Schema
  ),
  Schema.Struct({
    initialSelected: Schema.optional(Schema.Boolean),
  })
)

const FhirR4QuestionnaireItemSchema: Schema.Schema<
  QuestionnaireItem,
  FhirR4.QuestionnaireItem,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(QuestionnaireItemId),
  Schema.Struct({
    answerOption: Schema.optional(
      Schema.mutable(Schema.Array(FhirR4QuestionnaireItemAnswerOptionSchema))
    ),
    answerValueSet: Schema.optional(Schema.String),
    code: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4Coding.Schema))
      )
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
        Schema.Array(
          Schema.suspend(() => FhirR4QuestionnaireItemSchema)
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

export const FhirR4QuestionnaireItem = {
  Schema: FhirR4QuestionnaireItemSchema,
}

// --- Questionnaire ---

const FhirR4QuestionnaireSchema: Schema.Schema<
  Questionnaire,
  FhirR4.Questionnaire,
  never
> = Schema.extend(
  FhirR4DomainResource.Schema(QuestionnaireId),
  Schema.Struct({
    resourceType: Schema.Literal('Questionnaire'),
    approvalDate: Schema.optional(Schema.String),
    code: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4Coding.Schema))
      )
    ),
    contact: Schema.optional(Schema.Any),
    copyright: Schema.optional(Schema.String),
    date: Schema.optional(Schema.String),
    derivedFrom: Schema.optional(
      Schema.mutable(Schema.Array(Schema.String))
    ),
    description: Schema.optional(Schema.String),
    effectivePeriod: Schema.optional(Schema.Any),
    experimental: Schema.optional(Schema.Boolean),
    identifier: Schema.optional(Schema.Any),
    item: Schema.optional(
      Schema.mutable(Schema.Array(FhirR4QuestionnaireItemSchema))
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
      Schema.mutable(Schema.Array(Schema.String))
    ),
    title: Schema.optional(Schema.String),
    url: Schema.optional(Schema.String),
    useContext: Schema.optional(Schema.Any),
    version: Schema.optional(Schema.String),
  })
)

export const FhirR4Questionnaire = FhirR4ResourceBehaviourImpl({
  resourceType: 'Questionnaire',
  Schema: FhirR4QuestionnaireSchema,
})
