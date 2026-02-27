import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { IdentifierAndReference } from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'
import { CodeableConceptEncodedFromFhir } from './CodeableConcept'
import { PeriodEncodedFromFhir } from './Period'

export const ReferenceEncodedFromFhir: Schema.Schema<
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

const ReferenceSchema: Schema.Schema<
  IdentifierAndReference.Reference,
  FhirR4.Reference,
  BaseUrl
> = Schema.compose(ReferenceEncodedFromFhir, IdentifierAndReference.Reference)

export const FhirR4Reference = {
  Schema: ReferenceSchema,
}

export const IdentifierEncodedFromFhir: Schema.Schema<
  IdentifierAndReference.IdentifierEncoded,
  FhirR4.Identifier,
  BaseUrl
> = Schema.extend(
  ElementIdentification('Identifier'),
  mutableEncoded(
    Schema.Struct({
      period: Schema.optional(Schema.suspend(() => PeriodEncodedFromFhir)),
      system: Schema.optional(Schema.String),
      type: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
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
      assigner: Schema.optional(Schema.suspend(() => ReferenceEncodedFromFhir)),
    })
  )
)

const IdentifierSchema: Schema.Schema<
  IdentifierAndReference.Identifier,
  FhirR4.Identifier,
  BaseUrl
> = Schema.compose(IdentifierEncodedFromFhir, IdentifierAndReference.Identifier)

export const FhirR4Identifier = {
  Schema: IdentifierSchema,
}
