import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Coding,
  type CodingEncoded,
} from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementEncodedFromFhir } from '../base/Element'
import { mutableEncoded } from '@assessmentis/util'
import { TwoStepExternalSchema } from '@assessmentis/util'

const EncodedFromFhir: Schema.Schema<CodingEncoded, FhirR4.Coding, BaseUrl> =
  Schema.extend(
    ElementEncodedFromFhir('Coding'),
    mutableEncoded(
      Schema.Struct({
        code: Schema.optional(Schema.String),
        display: Schema.optional(Schema.String),
        system: Schema.optional(Schema.String),
        userSelected: Schema.optional(Schema.Boolean),
        version: Schema.optional(Schema.String),
      })
    )
  )

export const FhirR4Coding = new TwoStepExternalSchema(Coding, EncodedFromFhir)
