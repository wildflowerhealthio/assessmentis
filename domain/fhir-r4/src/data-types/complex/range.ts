import { Schema } from 'effect'

import { Range } from '@assessmentis/clinical-domain/data-types'
import type { RangeEncoded } from '@assessmentis/clinical-domain/data-types'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/element'
import type { BaseUrl } from '../url-identification'
import { FhirR4Quantity } from './quantity'

const EncodedFromFhir: Schema.Schema<RangeEncoded, FhirR4.Range, BaseUrl> = Schema.extend(
  ElementEncodedFromFhir('Range'),
  mutableEncoded(
    Schema.Struct({
      high: Schema.optional(FhirR4Quantity.EncodedFromExternal),
      low: Schema.optional(FhirR4Quantity.EncodedFromExternal),
    })
  )
)

export const FhirR4Range = new TwoStepExternalSchema(Range, EncodedFromFhir)
