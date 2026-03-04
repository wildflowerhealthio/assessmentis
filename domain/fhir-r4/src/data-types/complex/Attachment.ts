import { Schema } from 'effect'

import {
  Attachment,
  type AttachmentEncoded,
} from '@assessmentis/clinical-domain/data-types'
import {
  extendObjectSchemas,
  mutableEncoded,
  TwoStepExternalSchema,
} from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/Element'
import type { BaseUrl } from '../UrlIdentification'

const EncodedFromFhir: Schema.Schema<
  AttachmentEncoded,
  FhirR4.Attachment,
  BaseUrl
> = extendObjectSchemas(
  ElementEncodedFromFhir('Attachment'),
  mutableEncoded(
    Schema.Struct({
      contentType: Schema.optional(Schema.String),
      language: Schema.optional(Schema.String),
      data: Schema.optional(Schema.String),
      dataUrl: Schema.optional(Schema.String).pipe(Schema.fromKey('url')),
      size: Schema.optional(Schema.Number),
      hash: Schema.optional(Schema.String),
      title: Schema.optional(Schema.String),
      creation: Schema.optional(Schema.String),
    })
  )
)

export const FhirR4Attachment = new TwoStepExternalSchema(
  Attachment,
  EncodedFromFhir
)
