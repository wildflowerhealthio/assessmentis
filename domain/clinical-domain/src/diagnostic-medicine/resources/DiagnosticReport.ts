import { Schema } from 'effect'
import { DomainResource } from '../../foundation-framework/resources/DomainResource'
import { Identifier } from '../../general-purpose/Identifier'
import { Reference } from '../../general-purpose/Reference'
import { CodeableConcept } from '../../general-purpose/CodeableConcept'
import { Attachment } from '../../general-purpose/Attachment'
import { Period } from '../../general-purpose/Period'

export const DiagnosticReportId = Schema.String.pipe(
  Schema.brand('DiagnosticReportId')
)

export type DiagnosticReportId = typeof DiagnosticReportId.Type

/**
 * The status of the diagnostic report.
 * registered | partial | preliminary | final | amended | corrected | appended | cancelled | entered-in-error | unknown
 */
export const DiagnosticReportStatus = Schema.Enums({
  registered: 'registered',
  partial: 'partial',
  preliminary: 'preliminary',
  final: 'final',
  amended: 'amended',
  corrected: 'corrected',
  appended: 'appended',
  cancelled: 'cancelled',
  'entered-in-error': 'entered-in-error',
  unknown: 'unknown',
} as const)

export type DiagnosticReportStatus = typeof DiagnosticReportStatus.Type

/**
 * The findings and interpretation of diagnostic tests performed on patients, groups of patients, devices, and locations, and/or specimens derived from these. The report includes clinical context such as requesting and provider information, and some mix of atomic results, images, textual and coded interpretations, and formatted representation of diagnostic reports.
 */
export const DiagnosticReport = Schema.Struct({
  ...DomainResource(DiagnosticReportId).fields,
  resourceType: Schema.Literal('DiagnosticReport'),
  /**
   * Identifiers assigned to this report by the performer or other systems.
   */
  identifier: Schema.optional(Schema.Array(Identifier)),
  /**
   * Details concerning a service requested.
   */
  basedOn: Schema.optional(Schema.Array(Reference)),
  /**
   * The status of the diagnostic report.
   * This element is labeled as a modifier because the status contains codes that mark the resource as not currently valid.
   */
  status: DiagnosticReportStatus,
  /**
   * A code that classifies the clinical discipline, department or diagnostic service that created the report (e.g. cardiology, biochemistry, hematology, MRI). This is used for searching, sorting and display purposes.
   */
  category: Schema.optional(Schema.Array(CodeableConcept)),
  /**
   * A code or name that describes this diagnostic report.
   */
  code: CodeableConcept,
  /**
   * The subject of the report. Usually, but not always, this is a patient. However, diagnostic services also perform analyses on specimens collected from a variety of other sources.
   */
  subject: Schema.optional(Reference),
  /**
   * The healthcare event (e.g. a patient and healthcare provider interaction) which this DiagnosticReport is about.
   */
  encounter: Schema.optional(Reference),
  /**
   * The time or time-period the observed values are related to. When the subject of the report is a patient, this is usually either the time of the procedure or of specimen collection(s), but very often the source of the date/time is not known, only the date/time itself.
   * This is a choice element in FHIR (effective[x]) - only one of effectiveDateTime or effectivePeriod should be present.
   */
  effectiveDateTime: Schema.optional(Schema.DateTimeUtc),
  effectivePeriod: Schema.optional(Period),
  /**
   * The date and time that this version of the report was made available to providers, typically after the report was reviewed and verified.
   */
  issued: Schema.optional(Schema.DateTimeUtc),
  /**
   * The diagnostic service that is responsible for issuing the report.
   */
  performer: Schema.optional(Schema.Array(Reference)),
  /**
   * The practitioner or organization that is responsible for the report's conclusions and interpretations.
   */
  resultsInterpreter: Schema.optional(Schema.Array(Reference)),
  /**
   * Details about the specimens on which this diagnostic report is based.
   */
  specimen: Schema.optional(Schema.Array(Reference)),
  /**
   * Observations that are part of this diagnostic report.
   */
  result: Schema.optional(Schema.Array(Reference)),
  /**
   * One or more links to full details of any imaging performed during the diagnostic investigation. Typically, this is imaging performed by DICOM enabled modalities, but this is not required. A fully enabled PACS viewer can use this information to provide views of the source images.
   */
  imagingStudy: Schema.optional(Schema.Array(Reference)),
  /**
   * A list of key images associated with this report. The images are generally created during the diagnostic process, and may be directly of the patient, or of treated specimens (i.e. slides of interest).
   */
  media: Schema.optional(
    Schema.Array(
      Schema.Struct({
        /**
         * A comment about the image. Typically, this is used to provide an explanation for why the image is included, or to draw the viewer's attention to important features.
         */
        comment: Schema.optional(Schema.String),
        /**
         * Reference to the image source.
         */
        link: Reference,
      })
    )
  ),
  /**
   * Concise and clinically contextualized summary conclusion (interpretation/impression) of the diagnostic report.
   */
  conclusion: Schema.optional(Schema.String),
  /**
   * One or more codes that represent the summary conclusion (interpretation/impression) of the diagnostic report.
   */
  conclusionCode: Schema.optional(Schema.Array(CodeableConcept)),
  /**
   * Rich text representation of the entire result as issued by the diagnostic service. Multiple formats are allowed but they SHALL be semantically equivalent.
   */
  presentedForm: Schema.optional(Schema.Array(Attachment)),
})

export type DiagnosticReport = typeof DiagnosticReport.Type
