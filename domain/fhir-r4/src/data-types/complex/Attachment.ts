import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { Attachment } from '@assessmentis/clinical-domain/data-types'
import { Code, AttachmentId } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Element } from '../base/Element'

const FhirR4AttachmentSchema: Schema.Schema<
  Attachment,
  FhirR4.Attachment,
  never
> = Schema.extend(
  FhirR4Element.Schema(AttachmentId),
  Schema.mutable(
    Schema.Struct({
      contentType: Schema.optional(Code),
      language: Schema.optional(Code),
      data: Schema.optional(Schema.String),
      url: Schema.optional(Schema.String),
      size: Schema.optional(Schema.Number),
      hash: Schema.optional(Schema.String),
      title: Schema.optional(Schema.String),
      creation: Schema.optional(Schema.DateTimeUtc),
    })
  )
)

export const FhirR4Attachment = {
  Schema: FhirR4AttachmentSchema,
}
