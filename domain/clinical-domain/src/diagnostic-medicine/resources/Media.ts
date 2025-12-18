import { Schema } from 'effect'
import { DomainResource } from '../../data-types/base/DomainResource'
import { Identifier } from '../../data-types/complex/Identifier'
import { Reference } from '../../data-types/special-purpose/Reference'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Attachment } from '../../data-types/complex/Attachment'
import { Annotation } from '../../data-types/complex/Annotation'
import { Period } from '../../data-types/complex/Period'

export const MediaId = Schema.String.pipe(Schema.brand('MediaId'))

export type MediaId = typeof MediaId.Type

/**
 * The status of the media resource.
 * preparation | in-progress | not-done | on-hold | stopped | completed | entered-in-error | unknown
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
 * A photo, video, or audio recording acquired or used in healthcare. The actual content may be inline or provided by direct reference.
 */
export const Media = Schema.Struct({
  ...DomainResource(MediaId).fields,
  resourceType: Schema.Literal('Media'),
  /**
   * Identifiers associated with the image - these may include identifiers for the image itself, identifiers for the context of its collection (e.g. series ids) and context ids such as accession numbers or other workflow identifiers.
   */
  identifier: Schema.optional(Schema.Array(Identifier)),
  /**
   * A procedure that is fulfilled in whole or in part by the creation of this media.
   */
  basedOn: Schema.optional(Schema.Array(Reference)),
  /**
   * A larger event of which this particular event is a component or step.
   */
  partOf: Schema.optional(Schema.Array(Reference)),
  /**
   * The current state of the media resource.
   * This element is labeled as a modifier because the status contains codes that mark the resource as not currently valid.
   */
  status: MediaStatus,
  /**
   * A code that classifies whether the media is an image, video or audio recording or some other media category.
   */
  type: Schema.optional(CodeableConcept),
  /**
   * Details of the type of the media - usually, how it was acquired (what type of device). If images sourced from a DICOM system, are wrapped in a Media resource, then this is the modality.
   */
  modality: Schema.optional(CodeableConcept),
  /**
   * The name of the imaging view e.g. Lateral or Antero-posterior (AP).
   */
  view: Schema.optional(CodeableConcept),
  /**
   * Who/What this Media is a record of.
   */
  subject: Schema.optional(Reference),
  /**
   * The encounter that establishes the context for this media.
   */
  encounter: Schema.optional(Reference),
  /**
   * The date and time(s) at which the media was collected.
   * This is a choice element in FHIR (created[x]) - only one of createdDateTime or createdPeriod should be present.
   */
  createdDateTime: Schema.optional(Schema.DateTimeUtc),
  createdPeriod: Schema.optional(Period),
  /**
   * The date and time this version of the media was made available to providers, typically after having been reviewed.
   */
  issued: Schema.optional(Schema.DateTimeUtc),
  /**
   * The person who administered the collection of the image.
   */
  operator: Schema.optional(Reference),
  /**
   * Describes why the event occurred in coded or textual form.
   */
  reasonCode: Schema.optional(Schema.Array(CodeableConcept)),
  /**
   * Indicates the site on the subject's body where the observation was made (i.e. the target site).
   */
  bodySite: Schema.optional(CodeableConcept),
  /**
   * The name of the device / manufacturer of the device that was used to make the recording.
   */
  deviceName: Schema.optional(Schema.String),
  /**
   * The device used to collect the media.
   */
  device: Schema.optional(Reference),
  /**
   * Height of the image in pixels (photo/video).
   */
  height: Schema.optional(Schema.Number),
  /**
   * Width of the image in pixels (photo/video).
   */
  width: Schema.optional(Schema.Number),
  /**
   * The number of frames in a photo. This is used with a multi-page fax, or an imaging acquisition context that takes multiple slices in a single image, or an animated gif. If there is more than one frame, this SHALL have a value in order to alert interface software that a multi-frame capable rendering widget is required.
   */
  frames: Schema.optional(Schema.Number),
  /**
   * The duration of the recording in seconds - for audio and video.
   */
  duration: Schema.optional(Schema.Number),
  /**
   * The actual content of the media - inline or by direct reference to the media source file.
   * Recommended content types: image/jpeg, image/png, image/tiff, video/mpeg, audio/mp4, application/dicom. Application/dicom can contain the transfer syntax as a parameter.  For media that covers a period of time (video/sound), the content.creationTime is the end time. Creation time is used for tracking, organizing versions and searching.
   */
  content: Attachment,
  /**
   * Comments made about the media by the performer, subject or other participants.
   */
  note: Schema.optional(Schema.Array(Annotation)),
})

export type Media = typeof Media.Type
