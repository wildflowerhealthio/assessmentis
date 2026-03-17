import { Schema } from 'effect'

import {
  DiagnosticReport,
  DiagnosticReportStatus,
} from '@assessmentis/clinical-domain'
import type { DiagnosticReportEncoded } from '@assessmentis/clinical-domain'
import {
  extendObjectSchemas,
  mutableEncoded,
  TwoStepExternalSchema,
} from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import { FhirR4Attachment } from '../../data-types/complex/Attachment'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import { DiagnosticReportMediaEncodedFromFhir } from './DiagnosticReportMedia'
import { FhirR4ChoiceElements } from '@assessmentis/clinical-domain/data-types'
import { FhirChoiceElementTransform } from '../../data-types'

const EncodedFromFhir: Schema.Schema<
  DiagnosticReportEncoded,
  FhirR4.DiagnosticReport,
  BaseUrl
> = extendObjectSchemas(
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
        identifier: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)
            )
          )
        ),
        basedOn: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
            )
          )
        ),
        status: DiagnosticReportStatus,
        category: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
            )
          )
        ),
        code: Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal),
        subject: Schema.optional(
          Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
        ),
        encounter: Schema.optional(
          Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
        ),
        issued: Schema.optional(Schema.String),
        performer: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
            )
          )
        ),
        resultsInterpreter: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
            )
          )
        ),
        specimen: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
            )
          )
        ),
        result: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
            )
          )
        ),
        imagingStudy: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
            )
          )
        ),
        media: Schema.optional(
          mutableEncoded(Schema.Array(DiagnosticReportMediaEncodedFromFhir))
        ),
        conclusion: Schema.optional(Schema.String),
        conclusionCode: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
            )
          )
        ),
        presentedForm: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Attachment.EncodedFromExternal)
            )
          )
        ),
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
