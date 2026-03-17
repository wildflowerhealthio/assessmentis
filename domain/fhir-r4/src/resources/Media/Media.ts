import { Schema } from 'effect'

import { Media, MediaStatus } from '@assessmentis/clinical-domain'
import type { MediaEncoded } from '@assessmentis/clinical-domain'
import { mutableEncoded, TwoStepExternalSchema } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import { FhirR4Annotation } from '../../data-types/complex/Annotation'
import { FhirR4Attachment } from '../../data-types/complex/Attachment'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { FhirR4Period } from '../../data-types/complex/Period'
import type { BaseUrl } from '../../data-types/UrlIdentification'

const EncodedFromFhir: Schema.Schema<MediaEncoded, FhirR4.Media, BaseUrl> =
  Schema.extend(
    ResourceEncodedFromFhirR4Resource('Media', 'Media'),
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
        partOf: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
            )
          )
        ),
        status: MediaStatus,
        type: Schema.optional(
          Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
        ),
        modality: Schema.optional(
          Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
        ),
        view: Schema.optional(
          Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
        ),
        subject: Schema.optional(
          Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
        ),
        encounter: Schema.optional(
          Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
        ),
        createdDateTime: Schema.optional(Schema.String),
        createdPeriod: Schema.optional(
          Schema.suspend(() => FhirR4Period.EncodedFromExternal)
        ),
        issued: Schema.optional(Schema.String),
        operator: Schema.optional(
          Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
        ),
        reasonCode: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
            )
          )
        ),
        bodySite: Schema.optional(
          Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
        ),
        deviceName: Schema.optional(Schema.String),
        device: Schema.optional(
          Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
        ),
        height: Schema.optional(Schema.Number),
        width: Schema.optional(Schema.Number),
        frames: Schema.optional(Schema.Number),
        duration: Schema.optional(Schema.Number),
        content: Schema.suspend(() => FhirR4Attachment.EncodedFromExternal),
        note: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Annotation.EncodedFromExternal)
            )
          )
        ),
      })
    )
  )

export const FhirR4Media = new TwoStepExternalSchema<
  Media,
  MediaEncoded,
  FhirR4.Media,
  BaseUrl
>(Media, EncodedFromFhir)
