import { Schema } from 'effect'

import { Narrative } from '@assessmentis/clinical-domain/data-types'
import type { NarrativeEncoded } from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded, TwoStepExternalSchema } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/Element'
import type { BaseUrl } from '../UrlIdentification'

const NarrativeStatus = Schema.Union(
  Schema.Literal('generated'),
  Schema.Literal('extensions'),
  Schema.Literal('additional'),
  Schema.Literal('empty')
)

const EncodedFromFhir: Schema.Schema<
  NarrativeEncoded,
  FhirR4.Narrative,
  BaseUrl
> = Schema.extend(
  ElementEncodedFromFhir('Narrative'),
  mutableEncoded(
    Schema.Struct({
      status: NarrativeStatus,
      div: Schema.String,
    })
  )
)

export const FhirR4Narrative = new TwoStepExternalSchema(
  Narrative,
  EncodedFromFhir
)
