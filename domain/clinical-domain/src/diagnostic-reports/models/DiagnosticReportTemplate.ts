import { Schema } from 'effect'
import { Resource } from '../../general-purpose/Resource'
import { Attachment } from '../../general-purpose/Attachment'

export const DiagnosticReportTemplateId = Schema.String.pipe(
  Schema.brand('DiagnosticReportTemplateId')
)

export type DiagnosticReportTemplateId = typeof DiagnosticReportTemplateId.Type

/**
 * A template for generating diagnostic reports from questionnaire responses.
 * The template is a DOCX file with placeholders that will be filled with data
 * from questionnaire responses.
 */
export const DiagnosticReportTemplate = Schema.Struct({
  ...Resource(DiagnosticReportTemplateId).fields,
  /** Resource Type Name (for serialization) */
  resourceType: Schema.Literal('DiagnosticReportTemplate'),
  /**
   * The name of the template
   */
  name: Schema.optional(Schema.String),
  /**
   * A description of what this template is used for
   */
  description: Schema.optional(Schema.String),
  /**
   * Status of the template
   */
  status: Schema.Union(
    Schema.Literal('draft'),
    Schema.Literal('active'),
    Schema.Literal('retired')
  ),
  /**
   * The DOCX template file stored as an attachment
   */
  template: Attachment,
  /**
   * Reference to the questionnaire this template is designed for
   * Format: "Questionnaire/{id}"
   */
  questionnaireReference: Schema.optional(Schema.String),
  /**
   * The date when this template was created
   */
  createdDate: Schema.optional(Schema.String),
  /**
   * The date when this template was last modified
   */
  lastModifiedDate: Schema.optional(Schema.String),
})

export type DiagnosticReportTemplate = typeof DiagnosticReportTemplate.Type
