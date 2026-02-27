import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { MetaEncoded } from '@assessmentis/clinical-domain/data-types'
import { CodingEncodedFromFhir } from '../complex/Coding'
import type { BaseUrl } from '../UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

const FhirR4MetaSchema: Schema.Schema<MetaEncoded, FhirR4.Meta, BaseUrl> =
  mutableEncoded(
    Schema.Struct({
      versionId: Schema.optional(Schema.String),
      lastUpdated: Schema.optional(Schema.String),
      source: Schema.optional(Schema.String),
      security: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodingEncodedFromFhir))
        )
      ),
      tag: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodingEncodedFromFhir))
        )
      ),
    })
  )

export const FhirR4Meta = {
  Schema: FhirR4MetaSchema,
}
