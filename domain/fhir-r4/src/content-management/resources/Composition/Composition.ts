import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {} from '../../../FhirR4ResourceBehaviour'
import type { Composition } from '@assessmentis/clinical-domain/content-management'
import { CompositionId } from '@assessmentis/clinical-domain/content-management'
import { Code } from '@assessmentis/clinical-domain/data-types'
import { FhirR4DomainResource } from '../../../data-types/base/DomainResource'
import { FhirR4CodeableConcept } from '../../../data-types/complex/CodeableConcept'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../../data-types/complex/IdentifierAndReference'
import { FhirR4CompositionAttester } from './CompositionAttester'
import { FhirR4CompositionRelatesTo } from './CompositionRelatesTo'
import { FhirR4CompositionEvent } from './CompositionEvent'
import { FhirR4CompositionSection } from './CompositionSection'

const FhirR4CompositionSchema: Schema.Schema<
  Composition,
  FhirR4.Composition,
  never
> = Schema.extend(
  FhirR4DomainResource.Schema(CompositionId),
  Schema.mutable(
    Schema.Struct({
      resourceType: Schema.Literal('Composition'),
      identifier: Schema.optional(
        Schema.suspend(() => FhirR4Identifier.Schema)
      ),
      status: Schema.Union(
        Schema.Literal('preliminary'),
        Schema.Literal('final'),
        Schema.Literal('amended'),
        Schema.Literal('entered-in-error')
      ),
      type: Schema.suspend(() => FhirR4CodeableConcept.Schema),
      class: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.Schema)
      ),
      subject: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
      encounter: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
      date: Schema.DateTimeUtc,
      author: Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
      ),
      title: Schema.String,
      confidentiality: Schema.optional(Code),
      attester: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4CompositionAttester.Schema))
      ),
      custodian: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
      relatesTo: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4CompositionRelatesTo.Schema))
      ),
      event: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4CompositionEvent.Schema))
      ),
      section: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4CompositionSection.Schema))
      ),
    })
  )
)

export const FhirR4Composition = {
  resourceType: 'Composition',
  Schema: FhirR4CompositionSchema,
}
