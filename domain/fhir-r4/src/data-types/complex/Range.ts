import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Range,
  type RangeEncoded,
} from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementEncodedFromFhir } from '../base/Element'
import { mutableEncoded } from '@assessmentis/util'
import { TwoStepExternalSchema } from '@assessmentis/util'
import { FhirR4Quantity } from './Quantity'

const EncodedFromFhir: Schema.Schema<RangeEncoded, FhirR4.Range, BaseUrl> =
  Schema.extend(
    ElementEncodedFromFhir('Range'),
    mutableEncoded(
      Schema.Struct({
        low: Schema.optional(FhirR4Quantity.EncodedFromExternal),
        high: Schema.optional(FhirR4Quantity.EncodedFromExternal),
      })
    )
  )

export const FhirR4Range = new TwoStepExternalSchema(Range, EncodedFromFhir)
