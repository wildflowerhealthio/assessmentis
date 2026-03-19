import { Schema } from 'effect'

import { DiagnosticReport, DiagnosticReportStatus } from '@assessmentis/clinical-domain'
import type { DiagnosticReportEncoded } from '@assessmentis/clinical-domain'
import { TwoStepExternalSchema, extendObjectSchemas, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { FhirR4ChoiceElements } from '@assessmentis/clinical-domain/data-types'
import { FhirChoiceElementTransform } from '../../data-types'
import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/resource'
import { FhirR4Attachment } from '../../data-types/complex/attachment'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/identifier-and-reference'
import type { BaseUrl } from '../../data-types/url-identification'
import { DiagnosticReportMediaEncodedFromFhir } from './diagnostic-report-media'

const EncodedFromFhir: Schema.Schema<DiagnosticReportEncoded, FhirR4.DiagnosticReport, BaseUrl> =
  extendObjectSchemas(
    ResourceEncodedFromFhirR4Resource('DiagnosticReport', 'DiagnosticReport'),
    extendObjectSchemas(
      mutableEncoded(
        FhirChoiceElementTransform(
          'effective',
          FhirR4ChoiceElements['DiagnosticReport.effective[x]']
        )
      ),
      mutableEncoded(
        Schema.Struct({
          basedOn: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
          ),
          category: Schema.optional(
            mutableEncoded(
              Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
            )
          ),
          code: Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal),
          conclusion: Schema.optional(Schema.String),
          conclusionCode: Schema.optional(
            mutableEncoded(
              Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
            )
          ),
          encounter: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
          identifier: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)))
          ),
          imagingStudy: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
          ),
          issued: Schema.optional(Schema.String),
          media: Schema.optional(
            mutableEncoded(Schema.Array(DiagnosticReportMediaEncodedFromFhir))
          ),
          performer: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
          ),
          presentedForm: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Attachment.EncodedFromExternal)))
          ),
          result: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
          ),
          resultsInterpreter: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
          ),
          specimen: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
          ),
          status: DiagnosticReportStatus,
          subject: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
        })
      )
    )
  )

export const FhirR4DiagnosticReport = new TwoStepExternalSchema<
  DiagnosticReport,
  DiagnosticReportEncoded,
  FhirR4.DiagnosticReport,
  BaseUrl
>(DiagnosticReport, EncodedFromFhir)
