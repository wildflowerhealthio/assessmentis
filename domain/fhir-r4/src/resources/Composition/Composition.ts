import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Composition,
  type CompositionEncoded,
} from '@assessmentis/clinical-domain'
import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { CompositionAttesterEncodedFromFhir } from './CompositionAttester'
import { CompositionRelatesToEncodedFromFhir } from './CompositionRelatesTo'
import { CompositionEventEncodedFromFhir } from './CompositionEvent'
import { CompositionSectionEncodedFromFhir } from './CompositionSection'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'
import { TwoStepExternalSchema } from '@assessmentis/util'

const EncodedFromFhir: Schema.Schema<
  CompositionEncoded,
  FhirR4.Composition,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Composition', 'Composition'),
  mutableEncoded(
    Schema.Struct({
      identifier: Schema.optional(
        Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)
      ),
      status: Schema.Union(
        Schema.Literal('preliminary'),
        Schema.Literal('final'),
        Schema.Literal('amended'),
        Schema.Literal('entered-in-error')
      ),
      type: Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal),
      class: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      subject: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      encounter: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      date: Schema.String,
      author: mutableEncoded(
        Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal))
      ),
      title: Schema.String,
      confidentiality: Schema.optional(Schema.String),
      attester: Schema.optional(
        mutableEncoded(Schema.Array(CompositionAttesterEncodedFromFhir))
      ),
      custodian: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
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

export const FhirR4Composition = new TwoStepExternalSchema<
  Composition,
  CompositionEncoded,
  FhirR4.Composition,
  BaseUrl
>(Composition, EncodedFromFhir)
