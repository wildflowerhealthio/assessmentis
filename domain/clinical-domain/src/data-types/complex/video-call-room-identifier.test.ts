import { Arbitrary, DateTime } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { CodeableConcept } from './codeable-concept'
import { Identifier, Reference } from './identifier-and-reference'
import { Period } from './period'
import { VIDEO_CALL_ROOM_NAME_SYSTEM, VideoCallRoomIdentifier } from './video-call-room-identifier'

describe('VideoCallRoomIdentifier', () => {
  describe('make', () => {
    test('sets system to VIDEO_CALL_ROOM_NAME_SYSTEM', () => {
      const id = VideoCallRoomIdentifier.make({ value: 'test-room' })
      expect(id.system).toBe(VIDEO_CALL_ROOM_NAME_SYSTEM)
      expect(id.value).toBe('test-room')
    })
  })

  describe('toIdentifier', () => {
    test('produces a standard Identifier with system and value', () => {
      const roomId = VideoCallRoomIdentifier.make({ value: 'my-room' })
      const identifier = roomId.toIdentifier()
      expect(identifier).toBeInstanceOf(Identifier)
      expect(identifier.system).toBe(VIDEO_CALL_ROOM_NAME_SYSTEM)
      expect(identifier.value).toBe('my-room')
    })
  })

  describe('fromIdentifier', () => {
    test('extracts from matching Identifier', () => {
      const identifier = Identifier.make({
        system: VIDEO_CALL_ROOM_NAME_SYSTEM,
        value: 'room-42',
      })
      const result = VideoCallRoomIdentifier.fromIdentifier(identifier)
      expect(result).toBeDefined()
      expect(result!.value).toBe('room-42')
    })

    test('returns undefined for non-matching system', () => {
      const identifier = Identifier.make({
        system: 'http://other-system',
        value: 'room-42',
      })
      const result = VideoCallRoomIdentifier.fromIdentifier(identifier)
      expect(result).toBeUndefined()
    })

    test('returns undefined when value is missing', () => {
      const identifier = Identifier.make({
        system: VIDEO_CALL_ROOM_NAME_SYSTEM,
      })
      const result = VideoCallRoomIdentifier.fromIdentifier(identifier)
      expect(result).toBeUndefined()
    })

    test('preserves all optional fields when present', () => {
      const period = Period.make({
        start: DateTime.unsafeMake('2024-01-01T00:00:00Z'),
      })
      const type = CodeableConcept.make({ text: 'room-type' })
      const assigner = Reference.make({ display: 'Test Org' })

      const identifier = Identifier.make({
        assigner,
        period,
        system: VIDEO_CALL_ROOM_NAME_SYSTEM,
        type,
        use: 'official',
        value: 'room-99',
      })

      const result = VideoCallRoomIdentifier.fromIdentifier(identifier)
      expect(result).toBeDefined()
      expect(result!.value).toBe('room-99')
      expect(result!.period).toEqual(period)
      expect(result!.type).toEqual(type)
      expect(result!.use).toBe('official')
      expect(result!.assigner).toEqual(assigner)
    })
  })

  describe('findIn', () => {
    test('finds matching identifier in array', () => {
      const identifiers = [
        Identifier.make({ system: 'http://other', value: 'x' }),
        Identifier.make({
          system: VIDEO_CALL_ROOM_NAME_SYSTEM,
          value: 'found-room',
        }),
      ]
      const result = VideoCallRoomIdentifier.findIn(identifiers)
      expect(result).toBeDefined()
      expect(result!.value).toBe('found-room')
    })

    test('returns undefined when no match', () => {
      const identifiers = [Identifier.make({ system: 'http://other', value: 'x' })]
      const result = VideoCallRoomIdentifier.findIn(identifiers)
      expect(result).toBeUndefined()
    })

    test('returns undefined for empty/undefined array', () => {
      // oxlint-disable-next-line unicorn/no-useless-undefined -- testing undefined input
      expect(VideoCallRoomIdentifier.findIn(undefined)).toBeUndefined()
      expect(VideoCallRoomIdentifier.findIn([])).toBeUndefined()
    })
  })

  describe('properties', () => {
    test('toIdentifier → fromIdentifier round-trip preserves all fields', () => {
      const arb = Arbitrary.make(VideoCallRoomIdentifier)
      fc.assert(
        fc.property(arb, (roomId) => {
          const identifier = roomId.toIdentifier()
          const recovered = VideoCallRoomIdentifier.fromIdentifier(identifier)
          expect(recovered).toBeDefined()
          expect(recovered!.value).toBe(roomId.value)
          expect(recovered!.system).toBe(roomId.system)
          expect(recovered!.period).toEqual(roomId.period)
          expect(recovered!.type).toEqual(roomId.type)
          expect(recovered!.use).toEqual(roomId.use)
          expect(recovered!.assigner).toEqual(roomId.assigner)
        })
      )
    })
  })
})
