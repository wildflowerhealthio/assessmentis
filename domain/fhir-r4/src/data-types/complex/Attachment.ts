import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { Attachment } from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../base/Element'
import { mutableEncoded } from '@assessmentis/util'
import { TwoStepExternalSchema } from '@assessmentis/util'

const EncodedFromFhir: Schema.Schema<
  Attachment.AttachmentEncoded,
  FhirR4.Attachment,
  BaseUrl
> = Schema.extend(
  ElementIdentification('Attachment'),
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
  Attachment.Attachment,
  EncodedFromFhir
)
