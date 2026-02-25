import { Schema } from 'effect'
import { applySchemaMixinTo } from '@assessmentis/util'
import { Resource, type ResourceEncoded } from '../../data-types/base/Resource'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Attachment } from '../../data-types/complex/Attachment'
import { Annotation } from '../../data-types/complex/Annotation'
import { Period } from '../../data-types/complex/Period'

const Key = 'Media' as const
type Key = typeof Key

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

const fields = {
  resourceType: Schema.Literal('Media'),
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
  basedOn: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  partOf: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  status: MediaStatus,
  type: Schema.optional(Schema.suspend(() => CodeableConcept)),
  modality: Schema.optional(Schema.suspend(() => CodeableConcept)),
  view: Schema.optional(Schema.suspend(() => CodeableConcept)),
  subject: Schema.optional(Schema.suspend(() => Reference)),
  encounter: Schema.optional(Schema.suspend(() => Reference)),
  createdDateTime: Schema.optional(Schema.DateTimeUtc),
  createdPeriod: Schema.optional(Schema.suspend(() => Period)),
  issued: Schema.optional(Schema.DateTimeUtc),
  operator: Schema.optional(Schema.suspend(() => Reference)),
  reasonCode: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  bodySite: Schema.optional(Schema.suspend(() => CodeableConcept)),
  deviceName: Schema.optional(Schema.String),
  device: Schema.optional(Schema.suspend(() => Reference)),
  height: Schema.optional(Schema.Number),
  width: Schema.optional(Schema.Number),
  frames: Schema.optional(Schema.Number),
  duration: Schema.optional(Schema.Number),
  content: Schema.suspend(() => Attachment),
  note: Schema.optional(Schema.Array(Schema.suspend(() => Annotation))),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(Key)

export interface MediaEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<Key> {}

/**
 * A photo, video, or audio recording acquired or used in healthcare.
 * The actual content may be inline or provided by direct reference.
 */
class Media extends Schema.Class<Media>(Key)({
  ...resourceMixin.fields,
  ...fields,
}) {}

const MediaWithMixin = applySchemaMixinTo(Media, resourceMixin)
type MediaWithMixin = Media

export { MediaWithMixin as Media }
