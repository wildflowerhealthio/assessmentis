import { Schema } from 'effect'

import { Attachment } from '@assessmentis/clinical-domain/data-types'
import type { AttachmentEncoded } from '@assessmentis/clinical-domain/data-types'
import { TwoStepExternalSchema, extendObjectSchemas, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/element'
import type { BaseUrl } from '../url-identification'

const EncodedFromFhir: Schema.Schema<AttachmentEncoded, FhirR4.Attachment, BaseUrl> =
  extendObjectSchemas(
    ElementEncodedFromFhir('Attachment'),
    mutableEncoded(
      Schema.Struct({
        contentType: Schema.optional(Schema.String),
        creation: Schema.optional(Schema.String),
        data: Schema.optional(Schema.String),
        dataUrl: Schema.optional(Schema.String).pipe(Schema.fromKey('url')),
        hash: Schema.optional(Schema.String),
        language: Schema.optional(Schema.String),
        size: Schema.optional(Schema.Number),
        title: Schema.optional(Schema.String),
      })
    )
  )

export const FhirR4Attachment = new TwoStepExternalSchema(Attachment, EncodedFromFhir)
