import { Schema } from 'effect'

import { Coding } from '@assessmentis/clinical-domain/data-types'
import type { CodingEncoded } from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded, TwoStepExternalSchema } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/Element'
import type { BaseUrl } from '../UrlIdentification'

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
