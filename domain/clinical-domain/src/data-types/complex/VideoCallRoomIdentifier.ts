import { Schema } from 'effect'

import { MergeClasses } from '@assessmentis/util'

import { Element } from '../base/'
import { CodeableConcept, type CodeableConceptEncoded } from './CodeableConcept'
import {
  Identifier,
  IdentifierUse,
  Reference,
  type ReferenceEncoded,
} from './IdentifierAndReference'
import { Period } from './Period'

/**
 * The FHIR system URL used to identify video call room names.
 */
export const VIDEO_CALL_ROOM_NAME_SYSTEM =
  'http://assessment.is/fhir/video-call-room-name' as const

const DomainType = 'VideoCallRoomIdentifier' as const
type DomainType = typeof DomainType

const fields = {
  system: Schema.optionalWith({
    default: (): string => VIDEO_CALL_ROOM_NAME_SYSTEM,
  })(Schema.Literal(VIDEO_CALL_ROOM_NAME_SYSTEM as string)),
  value: Schema.String,
  period: Schema.optional(Schema.suspend(() => Period)),
  type: Schema.optional(
    Schema.suspend(
      (): Schema.Schema<
        typeof CodeableConcept.Type,
        CodeableConceptEncoded,
        never
      > => CodeableConcept
    )
  ),
  use: Schema.optional(IdentifierUse),
  assigner: Schema.optional(
    Schema.suspend((): Schema.Schema<Reference, ReferenceEncoded> => Reference)
  ),
} as const satisfies Schema.Struct.Fields

/**
 * A specialized Identifier for video call room names.
 *
 * Uses a fixed `system` of `http://assessment.is/fhir/video-call-room-name`
 * and requires a `value` (the room name).
 *
 * Convert to a standard `Identifier` via `toIdentifier()` for use in
 * resource `identifier[]` arrays.
 */
export class VideoCallRoomIdentifier extends MergeClasses<VideoCallRoomIdentifier>(
  DomainType
)([], Element(DomainType), fields) {
  static readonly SYSTEM = VIDEO_CALL_ROOM_NAME_SYSTEM

  /**
   * Convert to a standard FHIR Identifier for use in resource identifier arrays.
   */
  toIdentifier(): Identifier {
    return Identifier.make({
      system: this.system,
      value: this.value,
      ...(this.period !== undefined ? { period: this.period } : {}),
      ...(this.type !== undefined ? { type: this.type } : {}),
      ...(this.use !== undefined ? { use: this.use } : {}),
      ...(this.assigner !== undefined ? { assigner: this.assigner } : {}),
    })
  }

  /**
   * Extract a VideoCallRoomIdentifier from a standard Identifier,
   * if it has the matching system URL.
   */
  static fromIdentifier(id: Identifier): VideoCallRoomIdentifier | undefined {
    if (id.system === VIDEO_CALL_ROOM_NAME_SYSTEM && id.value !== undefined) {
      return VideoCallRoomIdentifier.make({
        value: id.value,
        ...(id.period !== undefined ? { period: id.period } : {}),
        ...(id.type !== undefined ? { type: id.type } : {}),
        ...(id.use !== undefined ? { use: id.use } : {}),
        ...(id.assigner !== undefined ? { assigner: id.assigner } : {}),
      })
    }
    return undefined
  }

  /**
   * Find a VideoCallRoomIdentifier in an array of Identifiers.
   */
  static findIn(
    identifiers: ReadonlyArray<Identifier> | undefined
  ): VideoCallRoomIdentifier | undefined {
    if (!identifiers) return undefined
    for (const id of identifiers) {
      const result = VideoCallRoomIdentifier.fromIdentifier(id)
      if (result) return result
    }
    return undefined
  }
}
