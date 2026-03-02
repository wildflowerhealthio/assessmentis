import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { Range } from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../base/Element'
import { mutableEncoded } from '@assessmentis/util'
import { TwoStepExternalSchema } from '@assessmentis/util'
import { FhirR4Quantity } from './Quantity'

const EncodedFromFhir: Schema.Schema<
  Range.RangeEncoded,
  FhirR4.Range,
  BaseUrl
> = Schema.extend(
  ElementIdentification('Range'),
  mutableEncoded(
    Schema.Struct({
      low: Schema.optional(FhirR4Quantity.EncodedFromExternal),
      high: Schema.optional(FhirR4Quantity.EncodedFromExternal),
    })
  )
)

export const FhirR4Range = new TwoStepExternalSchema(
  Range.Range,
  EncodedFromFhir
)
