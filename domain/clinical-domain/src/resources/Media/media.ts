import { Schema } from 'effect'

import { AnnotateArrayWithArbitrary, MergeClasses, makeCloneWith } from '@assessmentis/util'

import { Resource } from '../../data-types/base/resource'
import type { ResourceEncoded } from '../../data-types/base/resource'
import { Annotation } from '../../data-types/complex/annotation'
import { Attachment } from '../../data-types/complex/attachment'
import { CodeableConcept } from '../../data-types/complex/codeable-concept'
import { Identifier, Reference } from '../../data-types/complex/identifier-and-reference'
import type { ReferenceEncoded } from '../../data-types/complex/identifier-and-reference'
import { Period } from '../../data-types/complex/period'

const DomainType = 'Media' as const
type DomainType = typeof DomainType

/**
 * The status of the media resource.
 */
export const MediaStatus = Schema.Enums({
  completed: 'completed',
  'entered-in-error': 'entered-in-error',
  'in-progress': 'in-progress',
  'not-done': 'not-done',
  'on-hold': 'on-hold',
  preparation: 'preparation',
  stopped: 'stopped',
  unknown: 'unknown',
} as const)

/** Decoded status value for a {@link Media} resource. */
export type MediaStatus = typeof MediaStatus.Type

const fields = {
  basedOn: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  bodySite: Schema.optional(Schema.suspend(() => CodeableConcept)),
  content: Schema.suspend(() => Attachment),
  createdDateTime: Schema.optional(Schema.DateTimeUtc),
  createdPeriod: Schema.optional(Schema.suspend(() => Period)),
  device: Schema.optional(Schema.suspend(() => Reference)),
  deviceName: Schema.optional(Schema.String),
  duration: Schema.optional(Schema.Finite),
  encounter: Schema.optional(
    Schema.suspend((): Schema.Schema<Reference, ReferenceEncoded> => Reference)
  ),
  frames: Schema.optional(Schema.Int),
  height: Schema.optional(Schema.Int),
  identifier: Schema.optional(
    Schema.Array(Schema.suspend(() => Identifier)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  issued: Schema.optional(Schema.DateTimeUtc),
  modality: Schema.optional(Schema.suspend(() => CodeableConcept)),
  note: Schema.optional(
    Schema.Array(Schema.suspend(() => Annotation)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  operator: Schema.optional(Schema.suspend(() => Reference)),
  partOf: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  reasonCode: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  status: MediaStatus,
  subject: Schema.optional(Schema.suspend(() => Reference)),
  type: Schema.optional(Schema.suspend(() => CodeableConcept)),
  view: Schema.optional(Schema.suspend(() => CodeableConcept)),
  width: Schema.optional(Schema.Number),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(DomainType)

/** Encoded (wire-format) shape of a {@link Media}. */
export interface MediaEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {}

/**
 * A photo, video, or audio recording acquired or used in healthcare.
 * The actual content may be inline or provided by direct reference.
 */
export class Media extends MergeClasses<Media>(DomainType)([], resourceMixin, fields) {
  readonly cloneWith = makeCloneWith(Media, this)
}
