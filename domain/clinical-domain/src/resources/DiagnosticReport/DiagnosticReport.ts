import { Schema } from 'effect'
import { MergeClasses } from '@assessmentis/util'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Attachment } from '../../data-types/complex/Attachment'
import { Resource, type ResourceEncoded } from '../../data-types/base/Resource'
import { DatatypeChoice } from '../../data-types/Datatype'
import FhirR4ChoiceElements from '../../data-types/fhirR4ChoiceElements'
import { DiagnosticReportMedia } from './DiagnosticReportMedia'
import { Period } from '../../data-types'

const Key = 'DiagnosticReport' as const
type Key = typeof Key

/**
 * The status of the diagnostic report.
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

const fields = {
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
  basedOn: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  status: DiagnosticReportStatus,
  category: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  code: Schema.suspend(() => CodeableConcept),
  subject: Schema.optional(Schema.suspend(() => Reference)),
  encounter: Schema.optional(Schema.suspend(() => Reference)),

  issued: Schema.optional(Schema.DateTimeUtc),
  performer: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  resultsInterpreter: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference))
  ),
  specimen: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  result: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  imagingStudy: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  media: Schema.optional(Schema.Array(DiagnosticReportMedia)),
  conclusion: Schema.optional(Schema.String),
  conclusionCode: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  presentedForm: Schema.optional(
    Schema.Array(Schema.suspend(() => Attachment))
  ),
} as const satisfies Schema.Struct.Fields

class DiagnosticReportEffective extends DatatypeChoice(
  'DiagnosticReportEffective',
  'effective',
  FhirR4ChoiceElements['DiagnosticReport.effective[x]'],
  [Period.Datatype]
) {}

type effectiveMixinEncoded = typeof DiagnosticReportEffective.Encoded
const resourceMixin = Resource(Key)

export interface DiagnosticReportEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    ResourceEncoded<Key>,
    effectiveMixinEncoded {}

/**
 * The findings and interpretation of diagnostic tests performed on patients,
 * groups of patients, devices, and locations, and/or specimens derived from these.
 */
export class DiagnosticReport extends MergeClasses<DiagnosticReport>(Key)(
  [],
  resourceMixin,
  DiagnosticReportEffective,
  fields
) {}
