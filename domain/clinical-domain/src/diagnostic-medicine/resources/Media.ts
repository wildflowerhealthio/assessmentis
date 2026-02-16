import type { DateTime } from 'effect'
import { Data, Schema } from 'effect'
import type fhir from 'fhir/r4'
import type { DomainResource } from '../../data-types/base/DomainResource'
import { DomainResourceFromFhirR4 } from '../../data-types/base/DomainResource'
import type {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import {
  IdentifierFromFhirR4,
  ReferenceFromFhirR4,
} from '../../data-types/complex/IdentifierAndReference'
import type { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { CodeableConceptFromFhirR4 } from '../../data-types/complex/CodeableConcept'
import type { Attachment as AttachmentType } from '../../data-types/complex/Attachment'
import { AttachmentFromFhirR4 } from '../../data-types/complex/Attachment'
import type { Annotation } from '../../data-types/complex/Annotation'
import { AnnotationFromFhirR4 } from '../../data-types/complex/Annotation'
import type { Period as PeriodType } from '../../data-types/complex/Period'
import { PeriodFromFhirR4 } from '../../data-types/complex/Period'
import type { WithId } from '@assessmentis/effectful-store'

export const MediaId = Schema.String.pipe(Schema.brand('MediaId'))

export type MediaId = typeof MediaId.Type

/**
 * The status of the media resource.
 */
export const MediaStatus = Schema.Enums({
  preparation: 'preparation',
  'in-progress': 'in-progress',
  'not-done': 'not-done',
  'on-hold': 'on-hold',
  stopped: 'stopped',
  completed: 'completed',
  'entered-in-error': 'entered-in-error',
  unknown: 'unknown',
} as const)

export type MediaStatus = typeof MediaStatus.Type

/**
 * A photo, video, or audio recording acquired or used in healthcare.
 * The actual content may be inline or provided by direct reference.
 */
export interface Media extends DomainResource<MediaId> {
  resourceType: 'Media'
  identifier?: Identifier[]
  basedOn?: Reference[]
  partOf?: Reference[]
  status: MediaStatus
  type?: CodeableConcept
  modality?: CodeableConcept
  view?: CodeableConcept
  subject?: Reference
  encounter?: Reference
  createdDateTime?: DateTime.Utc
  createdPeriod?: PeriodType
  issued?: DateTime.Utc
  operator?: Reference
  reasonCode?: CodeableConcept[]
  bodySite?: CodeableConcept
  deviceName?: string
  device?: Reference
  height?: number
  width?: number
  frames?: number
  duration?: number
  content: AttachmentType
  note?: Annotation[]
}

export const Media = {
  make: Data.case<Media>(),
  makeWithId: Data.case<WithId<Media>>(),
}

export const MediaFromFhirR4: Schema.Schema<Media, fhir.Media, never> =
  Schema.extend(
    DomainResourceFromFhirR4(MediaId),
    Schema.Struct({
      resourceType: Schema.Literal('Media'),
      identifier: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => IdentifierFromFhirR4)))
      ),
      basedOn: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
      ),
      partOf: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
      ),
      status: MediaStatus,
      type: Schema.optional(Schema.suspend(() => CodeableConceptFromFhirR4)),
      modality: Schema.optional(
        Schema.suspend(() => CodeableConceptFromFhirR4)
      ),
      view: Schema.optional(Schema.suspend(() => CodeableConceptFromFhirR4)),
      subject: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
      encounter: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
      createdDateTime: Schema.optional(Schema.DateTimeUtc),
      createdPeriod: Schema.optional(Schema.suspend(() => PeriodFromFhirR4)),
      issued: Schema.optional(Schema.DateTimeUtc),
      operator: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
      reasonCode: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
        )
      ),
      bodySite: Schema.optional(
        Schema.suspend(() => CodeableConceptFromFhirR4)
      ),
      deviceName: Schema.optional(Schema.String),
      device: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
      height: Schema.optional(Schema.Number),
      width: Schema.optional(Schema.Number),
      frames: Schema.optional(Schema.Number),
      duration: Schema.optional(Schema.Number),
      content: Schema.suspend(() => AttachmentFromFhirR4),
      note: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => AnnotationFromFhirR4)))
      ),
    })
  )
