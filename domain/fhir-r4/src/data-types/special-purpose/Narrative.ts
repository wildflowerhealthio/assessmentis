import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Narrative,
  type NarrativeEncoded,
} from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../base/Element'
import { mutableEncoded } from '@assessmentis/util'
import { TwoStepExternalSchema } from '@assessmentis/util'

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
  ElementIdentification('Narrative'),
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
