import { Schema } from 'effect'

import { Composition } from '@assessmentis/clinical-domain'
import type { CompositionEncoded } from '@assessmentis/clinical-domain'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/resource'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/identifier-and-reference'
import type { BaseUrl } from '../../data-types/url-identification'
import { CompositionAttesterEncodedFromFhir } from './composition-attester'
import { CompositionEventEncodedFromFhir } from './composition-event'
import { CompositionRelatesToEncodedFromFhir } from './composition-relates-to'
import { CompositionSectionEncodedFromFhir } from './composition-section'

const EncodedFromFhir: Schema.Schema<CompositionEncoded, FhirR4.Composition, BaseUrl> =
  Schema.extend(
    ResourceEncodedFromFhirR4Resource('Composition', 'Composition'),
    mutableEncoded(
      Schema.Struct({
        attester: Schema.optional(mutableEncoded(Schema.Array(CompositionAttesterEncodedFromFhir))),
        author: mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal))
        ),
        class: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
        confidentiality: Schema.optional(Schema.String),
        custodian: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
        date: Schema.String,
        encounter: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
        event: Schema.optional(mutableEncoded(Schema.Array(CompositionEventEncodedFromFhir))),
        identifier: Schema.optional(Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)),
        relatesTo: Schema.optional(
          mutableEncoded(Schema.Array(CompositionRelatesToEncodedFromFhir))
        ),
        section: Schema.optional(mutableEncoded(Schema.Array(CompositionSectionEncodedFromFhir))),
        status: Schema.Union(
          Schema.Literal('preliminary'),
          Schema.Literal('final'),
          Schema.Literal('amended'),
          Schema.Literal('entered-in-error')
        ),
        subject: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
        title: Schema.String,
        type: Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal),
      })
    )
  )

export const FhirR4Composition = new TwoStepExternalSchema<
  Composition,
  CompositionEncoded,
  FhirR4.Composition,
  BaseUrl
>(Composition, EncodedFromFhir)
