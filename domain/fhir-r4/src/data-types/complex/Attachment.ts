import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { Attachment } from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

export const AttachmentEncodedFromFhir: Schema.Schema<
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

const AttachmentSchema: Schema.Schema<
  Attachment.Attachment,
  FhirR4.Attachment,
  BaseUrl
> = Schema.compose(AttachmentEncodedFromFhir, Attachment.Attachment)

export const FhirR4Attachment = {
  Schema: AttachmentSchema,
}
