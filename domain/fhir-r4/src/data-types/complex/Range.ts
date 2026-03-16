import { Schema } from 'effect'

import { Range } from '@assessmentis/clinical-domain/data-types'
import type { RangeEncoded } from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded, TwoStepExternalSchema } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/Element'
import type { BaseUrl } from '../UrlIdentification'
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
