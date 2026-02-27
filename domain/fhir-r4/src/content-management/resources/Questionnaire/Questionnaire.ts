import { pipe, Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Questionnaire,
  type QuestionnaireEncoded,
  QuestionnaireItem,
  type QuestionnaireItemEncoded,
} from '@assessmentis/clinical-domain'
import {
  AllDatatypeKeys,
  DatatypeChoiceEncodedPassthroughFields,
} from '@assessmentis/clinical-domain/data-types'
import { ResourceEncodedFromFhirR4Resource } from '../../../data-types/base/Resource'
import { BackboneElementEncodedFromFhir } from '../../../data-types/base/BackboneElement'
import { CodingEncodedFromFhir } from '../../../data-types/complex/Coding'
import type { BaseUrl } from '../../../data-types/UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

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

const QuestionnaireItemAnswerOptionEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('QuestionnaireItemAnswerOption'),
  mutableEncoded(
    Schema.Struct({
      initialSelected: Schema.optional(Schema.Boolean),
      ...DatatypeChoiceEncodedPassthroughFields('value', AllDatatypeKeys),
    })
  )
)

const QuestionnaireItemEncodedFromFhir: Schema.Schema<
  QuestionnaireItemEncoded,
  FhirR4.QuestionnaireItem,
  BaseUrl
> = Schema.extend(
  BackboneElementEncodedFromFhir('QuestionnaireItem'),
  mutableEncoded(
    Schema.Struct({
      answerOption: Schema.optional(
        mutableEncoded(
          Schema.Array(QuestionnaireItemAnswerOptionEncodedFromFhir)
        )
      ),
      answerValueSet: Schema.optional(Schema.String),
      code: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodingEncodedFromFhir))
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
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => QuestionnaireItemEncodedFromFhir)
          )
        )
      ),
      linkId: Schema.String,
      maxLength: Schema.optional(Schema.Number),
      prefix: Schema.optional(Schema.String),
      readOnly: Schema.optional(Schema.Boolean),
      repeats: Schema.optional(Schema.Boolean),
      required: Schema.optional(Schema.Boolean),
      text: Schema.optional(Schema.String),
      type: QuestionItemType,
    })
  )
)

export const FhirR4QuestionnaireItem = {
  Schema: Schema.compose(QuestionnaireItemEncodedFromFhir, QuestionnaireItem),
}

// --- Questionnaire ---

const FhirR4QuestionnaireEncodedFromFhir: Schema.Schema<
  QuestionnaireEncoded,
  FhirR4.Questionnaire,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Questionnaire', 'Questionnaire'),
  mutableEncoded(
    Schema.Struct({
      definitionUrl: pipe(
        Schema.optional(Schema.String),
        Schema.fromKey('url')
      ),
      approvalDate: Schema.optional(Schema.String),
      code: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodingEncodedFromFhir))
        )
      ),
      contact: Schema.optional(Schema.Any),
      copyright: Schema.optional(Schema.String),
      date: Schema.optional(Schema.String),
      derivedFrom: Schema.optional(
        mutableEncoded(Schema.Array(Schema.String))
      ),
      description: Schema.optional(Schema.String),
      effectivePeriod: Schema.optional(Schema.Any),
      experimental: Schema.optional(Schema.Boolean),
      identifier: Schema.optional(Schema.Any),
      item: Schema.optional(
        mutableEncoded(Schema.Array(QuestionnaireItemEncodedFromFhir))
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
        mutableEncoded(Schema.Array(Schema.String))
      ),
      title: Schema.optional(Schema.String),
      useContext: Schema.optional(Schema.Any),
      version: Schema.optional(Schema.String),
    })
  )
)

export const FhirR4Questionnaire = {
  resourceType: 'Questionnaire',
  Schema: Schema.compose(FhirR4QuestionnaireEncodedFromFhir, Questionnaire),
}
