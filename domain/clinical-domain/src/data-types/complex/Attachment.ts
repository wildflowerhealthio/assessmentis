import type { DateTime } from 'effect'
import { Schema } from 'effect'
import type fhir from 'fhir/r4'
import type { Code } from '../complex/Coding'
import { Code as CodeSchema } from '../complex/Coding'
import type { Element } from '../base/Element'
import { ElementFromFhirR4 } from '../base/Element'

export const AttachmentId = Schema.String.pipe(Schema.brand('AttachmentId'))
export type AttachmentId = typeof AttachmentId.Type

/**
 * For identifying specific representations or attachments.
 * This data type is used for all attachments including images, documents, etc.
 * Note: Per FHIR spec, if data is present, contentType SHALL be populated.
 */
export interface Attachment extends Element<AttachmentId> {
  /**
   * Identifies the type of the data in the attachment and allows a method to be chosen to interpret or render the data. Includes mime type parameters such as charset where appropriate.
   * Per FHIR R4 spec: if data is present, contentType SHALL be populated.
   */
  contentType?: Code
  /**
   * The human language of the content. The value can be any valid value according to BCP 47.
   */
  language?: Code
  /**
   * The actual data of the attachment - a sequence of bytes, base64 encoded.
   */
  data?: string
  /**
   * A location where the data can be accessed.
   */
  url?: string
  /**
   * The number of bytes of data that make up this attachment (before base64 encoding, if that is done).
   */
  size?: number
  /**
   * The calculated hash of the data using SHA-1. Represented using base64.
   */
  hash?: string
  /**
   * A label or set of text to display in place of the data.
   */
  title?: string
  /**
   * The date that the attachment was first created.
   */
  creation?: DateTime.Utc
}

export const AttachmentFromFhirR4: Schema.Schema<
  Attachment,
  fhir.Attachment,
  never
> = Schema.extend(
  ElementFromFhirR4(AttachmentId),
  Schema.mutable(
    Schema.Struct({
      /**
       * Identifies the type of the data in the attachment and allows a method to be chosen to interpret or render the data. Includes mime type parameters such as charset where appropriate.
       * Per FHIR R4 spec: if data is present, contentType SHALL be populated.
       */
      contentType: Schema.optional(CodeSchema),
      /**
       * The human language of the content. The value can be any valid value according to BCP 47.
       */
      language: Schema.optional(CodeSchema),
      /**
       * The actual data of the attachment - a sequence of bytes, base64 encoded.
       */
      data: Schema.optional(Schema.String),
      /**
       * A location where the data can be accessed.
       */
      url: Schema.optional(Schema.String),
      /**
       * The number of bytes of data that make up this attachment (before base64 encoding, if that is done).
       */
      size: Schema.optional(Schema.Number),
      /**
       * The calculated hash of the data using SHA-1. Represented using base64.
       */
      hash: Schema.optional(Schema.String),
      /**
       * A label or set of text to display in place of the data.
       */
      title: Schema.optional(Schema.String),
      /**
       * The date that the attachment was first created.
       */
      creation: Schema.optional(Schema.DateTimeUtc),
    })
  )
)
