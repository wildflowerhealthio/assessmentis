import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { Range } from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'
import { QuantityEncodedFromFhir } from './Quantity'

export const RangeEncodedFromFhir: Schema.Schema<
  Range.RangeEncoded,
  FhirR4.Range,
  BaseUrl
> = Schema.extend(
  ElementIdentification('Range'),
  mutableEncoded(
    Schema.Struct({
      low: Schema.optional(QuantityEncodedFromFhir),
      high: Schema.optional(QuantityEncodedFromFhir),
    })
  )
)

const RangeSchema: Schema.Schema<Range.Range, FhirR4.Range, BaseUrl> =
  Schema.compose(RangeEncodedFromFhir, Range.Range)

export const FhirR4Range = {
  Schema: RangeSchema,
}
