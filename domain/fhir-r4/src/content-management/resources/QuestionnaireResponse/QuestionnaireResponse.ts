import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { FhirR4ResourceBehaviourImpl } from '../../../FhirR4ResourceBehaviour'
import type { QuestionnaireResponse } from '@assessmentis/clinical-domain/content-management'
import {
  QuestionnaireResponseId,
  QuestionnaireResponseStatus,
  QuestionnaireId,
} from '@assessmentis/clinical-domain/content-management'
import { FhirR4DomainResource } from '../../../data-types/base/DomainResource'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../../data-types/complex/IdentifierAndReference'
import { FhirR4QuestionnaireResponseItem } from './QuestionnaireResponseItem'

const FhirR4QuestionnaireResponseSchema: Schema.Schema<
  QuestionnaireResponse,
  FhirR4.QuestionnaireResponse,
  never
> = Schema.extend(
  FhirR4DomainResource.Schema(QuestionnaireResponseId),
  Schema.Struct({
    resourceType: Schema.Literal('QuestionnaireResponse'),
    author: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
    authored: Schema.optional(Schema.String),
    basedOn: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => FhirR4Reference.Schema)))
    ),
    encounter: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
    identifier: Schema.optional(Schema.suspend(() => FhirR4Identifier.Schema)),
    item: Schema.optional(
      Schema.mutable(Schema.Array(FhirR4QuestionnaireResponseItem.Schema))
    ),
    partOf: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => FhirR4Reference.Schema)))
    ),
    questionnaire: Schema.optional(
      Schema.Union(Schema.String, QuestionnaireId)
    ),
    source: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
    status: QuestionnaireResponseStatus,
    subject: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
  })
)

export const FhirR4QuestionnaireResponse = FhirR4ResourceBehaviourImpl({
  resourceType: 'QuestionnaireResponse',
  Schema: FhirR4QuestionnaireResponseSchema,
})
