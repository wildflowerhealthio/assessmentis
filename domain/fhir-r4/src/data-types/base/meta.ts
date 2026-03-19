import { Schema } from 'effect'

import type { MetaEncoded } from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { FhirR4Coding } from '../complex/coding'
import type { BaseUrl } from '../url-identification'

const FhirR4MetaSchema: Schema.Schema<MetaEncoded, FhirR4.Meta, BaseUrl> = mutableEncoded(
  Schema.Struct({
    lastUpdated: Schema.optional(Schema.String),
    security: Schema.optional(
      mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Coding.EncodedFromExternal)))
    ),
    source: Schema.optional(Schema.String),
    tag: Schema.optional(
      mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Coding.EncodedFromExternal)))
    ),
    versionId: Schema.optional(Schema.String),
  })
)

export const FhirR4Meta = {
  Schema: FhirR4MetaSchema,
}
