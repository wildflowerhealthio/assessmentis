import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Composition,
  type CompositionEncoded,
} from '@assessmentis/clinical-domain'
import { ResourceEncodedFromFhirR4Resource } from '../../../data-types/base/Resource'
import { CodeableConceptEncodedFromFhir } from '../../../data-types/complex/CodeableConcept'
import {
  IdentifierEncodedFromFhir,
  ReferenceEncodedFromFhir,
} from '../../../data-types/complex/IdentifierAndReference'
import { CompositionAttesterEncodedFromFhir } from './CompositionAttester'
import { CompositionRelatesToEncodedFromFhir } from './CompositionRelatesTo'
import { CompositionEventEncodedFromFhir } from './CompositionEvent'
import { CompositionSectionEncodedFromFhir } from './CompositionSection'
import type { BaseUrl } from '../../../data-types/UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

const FhirR4CompositionEncodedFromFhir: Schema.Schema<
  CompositionEncoded,
  FhirR4.Composition,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Composition', 'Composition'),
  mutableEncoded(
    Schema.Struct({
      identifier: Schema.optional(
        Schema.suspend(() => IdentifierEncodedFromFhir)
      ),
      status: Schema.Union(
        Schema.Literal('preliminary'),
        Schema.Literal('final'),
        Schema.Literal('amended'),
        Schema.Literal('entered-in-error')
      ),
      type: Schema.suspend(() => CodeableConceptEncodedFromFhir),
      class: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      subject: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      encounter: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      date: Schema.String,
      author: mutableEncoded(
        Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
      ),
      title: Schema.String,
      confidentiality: Schema.optional(Schema.String),
      attester: Schema.optional(
        mutableEncoded(Schema.Array(CompositionAttesterEncodedFromFhir))
      ),
      custodian: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      relatesTo: Schema.optional(
        mutableEncoded(Schema.Array(CompositionRelatesToEncodedFromFhir))
      ),
      event: Schema.optional(
        mutableEncoded(Schema.Array(CompositionEventEncodedFromFhir))
      ),
      section: Schema.optional(
        mutableEncoded(Schema.Array(CompositionSectionEncodedFromFhir))
      ),
    })
  )
)

export const FhirR4Composition = {
  resourceType: 'Composition',
  Schema: Schema.compose(FhirR4CompositionEncodedFromFhir, Composition),
}
