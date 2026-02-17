import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { FhirR4ResourceBehaviourImpl } from '../../FhirR4ResourceBehaviour'
import type { Media } from '@assessmentis/clinical-domain/diagnostic-medicine'
import {
  MediaId,
  MediaStatus,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { FhirR4DomainResource } from '../../data-types/base/DomainResource'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { FhirR4Attachment } from '../../data-types/complex/Attachment'
import { FhirR4Annotation } from '../../data-types/complex/Annotation'
import { FhirR4Period } from '../../data-types/complex/Period'

const FhirR4MediaSchema: Schema.Schema<Media, FhirR4.Media, never> =
  Schema.extend(
    FhirR4DomainResource.Schema(MediaId),
    Schema.Struct({
      resourceType: Schema.Literal('Media'),
      identifier: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Identifier.Schema))
        )
      ),
      basedOn: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
        )
      ),
      partOf: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
        )
      ),
      status: MediaStatus,
      type: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.Schema)),
      modality: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.Schema)
      ),
      view: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.Schema)),
      subject: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
      encounter: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
      createdDateTime: Schema.optional(Schema.DateTimeUtc),
      createdPeriod: Schema.optional(Schema.suspend(() => FhirR4Period.Schema)),
      issued: Schema.optional(Schema.DateTimeUtc),
      operator: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
      reasonCode: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
        )
      ),
      bodySite: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.Schema)
      ),
      deviceName: Schema.optional(Schema.String),
      device: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
      height: Schema.optional(Schema.Number),
      width: Schema.optional(Schema.Number),
      frames: Schema.optional(Schema.Number),
      duration: Schema.optional(Schema.Number),
      content: Schema.suspend(() => FhirR4Attachment.Schema),
      note: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Annotation.Schema))
        )
      ),
    })
  )

export const FhirR4Media = FhirR4ResourceBehaviourImpl({
  resourceType: 'Media',
  Schema: FhirR4MediaSchema,
})
