import type { DateTime } from 'effect'
import { pipe, Schema } from 'effect'
import { ClinicalResourceBehaviourImpl } from '../../ClinicalResourceBehaviour'
import { DomainResource } from '../../data-types/base/DomainResource'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Attachment } from '../../data-types/complex/Attachment'
import { Annotation } from '../../data-types/complex/Annotation'
import { Period } from '../../data-types/complex/Period'
import { WithSymbolTag } from '@assessmentis/util'
import { Resource } from '@assessmentis/effectful-store'

const ResourceSymbol: unique symbol = Symbol.for(
  '@assessmentis/clinical-domain/Media'
)
type ResourceSymbol = typeof ResourceSymbol

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
export interface Media
  extends
    DomainResource<MediaId>,
    Resource.Resource<ResourceSymbol, Resource.ReadonlyUrl> {
  [Resource.ResourceType]: ResourceSymbol
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
  createdPeriod?: Period
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
  content: Attachment
  note?: Annotation[]
}

const MediaSchema = pipe(
  DomainResource.Schema(MediaId),
  WithSymbolTag(Resource.ResourceType, ResourceSymbol),
  Schema.extend(
    Schema.Struct({
      resourceType: Schema.Literal('Media'),
      identifier: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Identifier.Schema)))
      ),
      basedOn: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      partOf: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      status: MediaStatus,
      type: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
      modality: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
      view: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
      subject: Schema.optional(Schema.suspend(() => Reference.Schema)),
      encounter: Schema.optional(Schema.suspend(() => Reference.Schema)),
      createdDateTime: Schema.optional(Schema.DateTimeUtc),
      createdPeriod: Schema.optional(Schema.suspend(() => Period.Schema)),
      issued: Schema.optional(Schema.DateTimeUtc),
      operator: Schema.optional(Schema.suspend(() => Reference.Schema)),
      reasonCode: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => CodeableConcept.Schema))
        )
      ),
      bodySite: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
      deviceName: Schema.optional(Schema.String),
      device: Schema.optional(Schema.suspend(() => Reference.Schema)),
      height: Schema.optional(Schema.Number),
      width: Schema.optional(Schema.Number),
      frames: Schema.optional(Schema.Number),
      duration: Schema.optional(Schema.Number),
      content: Schema.suspend(() => Attachment.Schema),
      note: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Annotation.Schema)))
      ),
    })
  )
)

type MediaEncoded = Schema.Schema.Encoded<typeof MediaSchema>

/**
 * Schema for transforming between Media Data objects and FHIR R4 Media resources.
 */
export const Media = ClinicalResourceBehaviourImpl<Media, MediaEncoded>({
  ResourceSymbol,
  resourceType: 'Media',
  Schema: MediaSchema,
})
