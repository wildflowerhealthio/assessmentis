import { Schema } from 'effect'

import { Element } from '../base/'
import { CodeableConcept } from './codeable-concept'
import type { CodeableConceptEncoded } from './codeable-concept'
import { Identifier, IdentifierUse, Reference } from './identifier-and-reference'
import type { ReferenceEncoded } from './identifier-and-reference'
import { Period } from './period'

/**
 * The FHIR system URL used to identify video call room names.
 */
export const VIDEO_CALL_ROOM_NAME_SYSTEM = 'http://assessment.is/fhir/video-call-room-name' as const

const DomainType = 'VideoCallRoomIdentifier' as const
type DomainType = typeof DomainType

const fields = {
  assigner: Schema.optional(
    Schema.suspend((): Schema.Schema<Reference, ReferenceEncoded> => Reference)
  ),
  period: Schema.optional(Schema.suspend(() => Period)),
  system: Schema.optionalWith({
    default: (): string => VIDEO_CALL_ROOM_NAME_SYSTEM,
  })(Schema.Literal(VIDEO_CALL_ROOM_NAME_SYSTEM as string)),
  type: Schema.optional(
    Schema.suspend(
      (): Schema.Schema<typeof CodeableConcept.Type, CodeableConceptEncoded> => CodeableConcept
    )
  ),
  use: Schema.optional(IdentifierUse),
  value: Schema.String,
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
const ElementMixin = Element(DomainType)

export class VideoCallRoomIdentifier extends ElementMixin.extend<VideoCallRoomIdentifier>(
  DomainType
)(fields) {
  static DomainType = ElementMixin.DomainType
  static UrlSchema = ElementMixin.UrlSchema
  static readonly SYSTEM = VIDEO_CALL_ROOM_NAME_SYSTEM

  /**
   * Convert to a standard FHIR Identifier for use in resource identifier arrays.
   */
  toIdentifier(): Identifier {
    return Identifier.make({
      system: this.system,
      value: this.value,
      // oxlint-disable-next-line eslint/no-ternary
      ...(this.period === undefined ? {} : { period: this.period }),
      // oxlint-disable-next-line eslint/no-ternary
      ...(this.type === undefined ? {} : { type: this.type }),
      // oxlint-disable-next-line eslint/no-ternary
      ...(this.use === undefined ? {} : { use: this.use }),
      // oxlint-disable-next-line eslint/no-ternary
      ...(this.assigner === undefined ? {} : { assigner: this.assigner }),
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
        // oxlint-disable-next-line eslint/no-ternary
        ...(id.period === undefined ? {} : { period: id.period }),
        // oxlint-disable-next-line eslint/no-ternary
        ...(id.type === undefined ? {} : { type: id.type }),
        // oxlint-disable-next-line eslint/no-ternary
        ...(id.use === undefined ? {} : { use: id.use }),
        // oxlint-disable-next-line eslint/no-ternary
        ...(id.assigner === undefined ? {} : { assigner: id.assigner }),
      })
    }
    return undefined
  }

  /**
   * Find a VideoCallRoomIdentifier in an array of Identifiers.
   */
  static findIn(
    identifiers: readonly Identifier[] | undefined
  ): VideoCallRoomIdentifier | undefined {
    if (!identifiers) {
      return undefined
    }
    for (const id of identifiers) {
      const result = VideoCallRoomIdentifier.fromIdentifier(id)
      if (result) {
        return result
      }
    }
    return undefined
  }
}
