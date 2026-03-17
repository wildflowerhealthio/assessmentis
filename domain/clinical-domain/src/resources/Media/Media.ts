import { Schema } from 'effect'

import { AnnotateArrayWithArbitrary, MergeClasses } from '@assessmentis/util'

import { Resource } from '../../data-types/base/Resource'
import type { ResourceEncoded } from '../../data-types/base/Resource'
import { Annotation } from '../../data-types/complex/Annotation'
import { Attachment } from '../../data-types/complex/Attachment'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import type { ReferenceEncoded } from '../../data-types/complex/IdentifierAndReference'
import { Period } from '../../data-types/complex/Period'

const DomainType = 'Media' as const
type DomainType = typeof DomainType

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

/** Decoded status value for a {@link Media} resource. */
export type MediaStatus = typeof MediaStatus.Type

const fields = {
  identifier: Schema.optional(
    Schema.Array(Schema.suspend(() => Identifier)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  basedOn: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  partOf: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  status: MediaStatus,
  type: Schema.optional(Schema.suspend(() => CodeableConcept)),
  modality: Schema.optional(Schema.suspend(() => CodeableConcept)),
  view: Schema.optional(Schema.suspend(() => CodeableConcept)),
  subject: Schema.optional(Schema.suspend(() => Reference)),
  encounter: Schema.optional(
    Schema.suspend(
      (): Schema.Schema<Reference, ReferenceEncoded, never> => Reference
    )
  ),
  createdDateTime: Schema.optional(Schema.DateTimeUtc),
  createdPeriod: Schema.optional(Schema.suspend(() => Period)),
  issued: Schema.optional(Schema.DateTimeUtc),
  operator: Schema.optional(Schema.suspend(() => Reference)),
  reasonCode: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  bodySite: Schema.optional(Schema.suspend(() => CodeableConcept)),
  deviceName: Schema.optional(Schema.String),
  device: Schema.optional(Schema.suspend(() => Reference)),
  height: Schema.optional(Schema.Number),
  width: Schema.optional(Schema.Number),
  frames: Schema.optional(Schema.Number),
  duration: Schema.optional(Schema.Number),
  content: Schema.suspend(() => Attachment),
  note: Schema.optional(
    Schema.Array(Schema.suspend(() => Annotation)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(DomainType)

/** Encoded (wire-format) shape of a {@link Media}. */
export interface MediaEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {}

/**
 * A photo, video, or audio recording acquired or used in healthcare.
 * The actual content may be inline or provided by direct reference.
 */
export class Media extends MergeClasses<Media>(DomainType)(
  [],
  resourceMixin,
  fields
) {}
