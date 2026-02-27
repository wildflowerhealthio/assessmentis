import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { IdentifierAndReference } from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../base/Element'
import { mutableEncoded } from '@assessmentis/util'
import { FhirR4CodeableConcept } from './CodeableConcept'
import { FhirR4Period } from './Period'
import { TwoStepExternalSchema } from '../../TwoStepExternalSchema'

const ReferenceEncodedFromFhir: Schema.Schema<
  IdentifierAndReference.ReferenceEncoded,
  FhirR4.Reference,
  BaseUrl
> = Schema.extend(
  ElementIdentification('Reference'),
  mutableEncoded(
    Schema.Struct({
      display: Schema.optional(Schema.String),
      reference: Schema.optional(Schema.String),
      type: Schema.optional(Schema.String),
      identifier: Schema.optional(
        Schema.suspend(() => IdentifierEncodedFromFhir)
      ),
    })
  )
)

export const FhirR4Reference = new TwoStepExternalSchema(
  IdentifierAndReference.Reference,
  ReferenceEncodedFromFhir
)

const IdentifierEncodedFromFhir: Schema.Schema<
  IdentifierAndReference.IdentifierEncoded,
  FhirR4.Identifier,
  BaseUrl
> = Schema.extend(
  ElementIdentification('Identifier'),
  mutableEncoded(
    Schema.Struct({
      period: Schema.optional(
        Schema.suspend(() => FhirR4Period.EncodedFromExternal)
      ),
      system: Schema.optional(Schema.String),
      type: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      use: Schema.optional(
        Schema.Union(
          Schema.Literal('usual'),
          Schema.Literal('official'),
          Schema.Literal('temp'),
          Schema.Literal('secondary'),
          Schema.Literal('old')
        )
      ),
      value: Schema.optional(Schema.String),
      assigner: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
    })
  )
)

export const FhirR4Identifier = new TwoStepExternalSchema(
  IdentifierAndReference.Identifier,
  IdentifierEncodedFromFhir
)
