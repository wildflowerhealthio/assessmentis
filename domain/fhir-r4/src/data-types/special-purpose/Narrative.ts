import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Narrative,
  type NarrativeEncoded,
} from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

const NarrativeStatus = Schema.Union(
  Schema.Literal('generated'),
  Schema.Literal('extensions'),
  Schema.Literal('additional'),
  Schema.Literal('empty')
)

export const NarrativeEncodedFromFhir: Schema.Schema<
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

const NarrativeSchema: Schema.Schema<Narrative, FhirR4.Narrative, BaseUrl> =
  Schema.compose(NarrativeEncodedFromFhir, Narrative)

export const FhirR4Narrative = {
  Schema: NarrativeSchema,
}
