import { Schema } from 'effect'

import { Identifier, Reference } from '@assessmentis/clinical-domain/data-types'
import type {
  IdentifierEncoded,
  ReferenceEncoded,
} from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded, TwoStepExternalSchema } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/Element'
import type { BaseUrl } from '../UrlIdentification'
import { FhirR4CodeableConcept } from './CodeableConcept'
import { FhirR4Period } from './Period'

const ReferenceEncodedFromFhir: Schema.Schema<
  ReferenceEncoded,
  FhirR4.Reference,
  BaseUrl
> = Schema.extend(
  ElementEncodedFromFhir('Reference'),
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
  Reference,
  ReferenceEncodedFromFhir
)

const IdentifierEncodedFromFhir: Schema.Schema<
  IdentifierEncoded,
  FhirR4.Identifier,
  BaseUrl
> = Schema.extend(
  ElementEncodedFromFhir('Identifier'),
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
      assigner: Schema.optional(Schema.suspend(() => ReferenceEncodedFromFhir)),
    })
  )
)

export const FhirR4Identifier = new TwoStepExternalSchema(
  Identifier,
  IdentifierEncodedFromFhir
)
