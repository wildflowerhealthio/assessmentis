import { Schema } from 'effect'

import { Media, MediaStatus } from '@assessmentis/clinical-domain'
import type { MediaEncoded } from '@assessmentis/clinical-domain'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/resource'
import { FhirR4Annotation } from '../../data-types/complex/annotation'
import { FhirR4Attachment } from '../../data-types/complex/attachment'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/identifier-and-reference'
import { FhirR4Period } from '../../data-types/complex/period'
import type { BaseUrl } from '../../data-types/url-identification'

const EncodedFromFhir: Schema.Schema<MediaEncoded, FhirR4.Media, BaseUrl> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Media', 'Media'),
  mutableEncoded(
    Schema.Struct({
      basedOn: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
      ),
      bodySite: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
      content: Schema.suspend(() => FhirR4Attachment.EncodedFromExternal),
      createdDateTime: Schema.optional(Schema.String),
      createdPeriod: Schema.optional(Schema.suspend(() => FhirR4Period.EncodedFromExternal)),
      device: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
      deviceName: Schema.optional(Schema.String),
      duration: Schema.optional(Schema.Finite),
      encounter: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
      frames: Schema.optional(Schema.Int),
      height: Schema.optional(Schema.Int),
      identifier: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)))
      ),
      issued: Schema.optional(Schema.String),
      modality: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
      note: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Annotation.EncodedFromExternal)))
      ),
      operator: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
      partOf: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
      ),
      reasonCode: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
        )
      ),
      status: MediaStatus,
      subject: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
      type: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
      view: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
      width: Schema.optional(Schema.Int),
    })
  )
)

export const FhirR4Media = new TwoStepExternalSchema<Media, MediaEncoded, FhirR4.Media, BaseUrl>(
  Media,
  EncodedFromFhir
)
