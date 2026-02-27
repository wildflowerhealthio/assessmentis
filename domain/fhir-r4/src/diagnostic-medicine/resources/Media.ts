import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { Media, type MediaEncoded } from '@assessmentis/clinical-domain'
import { MediaStatus } from '@assessmentis/clinical-domain'
import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import {
  IdentifierEncodedFromFhir,
  ReferenceEncodedFromFhir,
} from '../../data-types/complex/IdentifierAndReference'
import { CodeableConceptEncodedFromFhir } from '../../data-types/complex/CodeableConcept'
import { AttachmentEncodedFromFhir } from '../../data-types/complex/Attachment'
import { AnnotationEncodedFromFhir } from '../../data-types/complex/Annotation'
import { PeriodEncodedFromFhir } from '../../data-types/complex/Period'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

const FhirR4MediaEncodedFromFhir: Schema.Schema<
  MediaEncoded,
  FhirR4.Media,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Media', 'Media'),
  mutableEncoded(
    Schema.Struct({
      identifier: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => IdentifierEncodedFromFhir))
        )
      ),
      basedOn: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      partOf: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      status: MediaStatus,
      type: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      modality: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      view: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      subject: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      encounter: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      createdDateTime: Schema.optional(Schema.String),
      createdPeriod: Schema.optional(
        Schema.suspend(() => PeriodEncodedFromFhir)
      ),
      issued: Schema.optional(Schema.String),
      operator: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      reasonCode: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      bodySite: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      deviceName: Schema.optional(Schema.String),
      device: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      height: Schema.optional(Schema.Number),
      width: Schema.optional(Schema.Number),
      frames: Schema.optional(Schema.Number),
      duration: Schema.optional(Schema.Number),
      content: Schema.suspend(() => AttachmentEncodedFromFhir),
      note: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => AnnotationEncodedFromFhir))
        )
      ),
    })
  )
)

export const FhirR4Media = {
  resourceType: 'Media',
  Schema: Schema.compose(FhirR4MediaEncodedFromFhir, Media),
}
