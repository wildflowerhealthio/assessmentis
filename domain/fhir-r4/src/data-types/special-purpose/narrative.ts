import { Schema } from 'effect'

import { Narrative } from '@assessmentis/clinical-domain/data-types'
import type { NarrativeEncoded } from '@assessmentis/clinical-domain/data-types'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/element'
import type { BaseUrl } from '../url-identification'

const NarrativeStatus = Schema.Union(
  Schema.Literal('generated'),
  Schema.Literal('extensions'),
  Schema.Literal('additional'),
  Schema.Literal('empty')
)

const EncodedFromFhir: Schema.Schema<NarrativeEncoded, FhirR4.Narrative, BaseUrl> = Schema.extend(
  ElementEncodedFromFhir('Narrative'),
  mutableEncoded(
    Schema.Struct({
      div: Schema.String,
      status: NarrativeStatus,
    })
  )
)

export const FhirR4Narrative = new TwoStepExternalSchema(Narrative, EncodedFromFhir)
