import { describe, expect, test } from 'vitest'

import { Identifier } from './IdentifierAndReference'
import {
  VIDEO_CALL_ROOM_NAME_SYSTEM,
  VideoCallRoomIdentifier,
} from './VideoCallRoomIdentifier'

describe('VideoCallRoomIdentifier', () => {
  test('make sets system to VIDEO_CALL_ROOM_NAME_SYSTEM', () => {
    const id = VideoCallRoomIdentifier.make({ value: 'test-room' })
    expect(id.system).toBe(VIDEO_CALL_ROOM_NAME_SYSTEM)
    expect(id.value).toBe('test-room')
  })

  test('toIdentifier produces a standard Identifier', () => {
    const roomId = VideoCallRoomIdentifier.make({ value: 'my-room' })
    const identifier = roomId.toIdentifier()
    expect(identifier).toBeInstanceOf(Identifier)
    expect(identifier.system).toBe(VIDEO_CALL_ROOM_NAME_SYSTEM)
    expect(identifier.value).toBe('my-room')
  })

  test('fromIdentifier extracts from matching Identifier', () => {
    const identifier = Identifier.make({
      system: VIDEO_CALL_ROOM_NAME_SYSTEM,
      value: 'room-42',
    })
    const result = VideoCallRoomIdentifier.fromIdentifier(identifier)
    expect(result).toBeDefined()
    expect(result!.value).toBe('room-42')
  })

  test('fromIdentifier returns undefined for non-matching system', () => {
    const identifier = Identifier.make({
      system: 'http://other-system',
      value: 'room-42',
    })
    const result = VideoCallRoomIdentifier.fromIdentifier(identifier)
    expect(result).toBeUndefined()
  })

  test('fromIdentifier returns undefined when value is missing', () => {
    const identifier = Identifier.make({
      system: VIDEO_CALL_ROOM_NAME_SYSTEM,
    })
    const result = VideoCallRoomIdentifier.fromIdentifier(identifier)
    expect(result).toBeUndefined()
  })

  test('findIn finds matching identifier in array', () => {
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

  test('findIn returns undefined when no match', () => {
    const identifiers = [
      Identifier.make({ system: 'http://other', value: 'x' }),
    ]
    const result = VideoCallRoomIdentifier.findIn(identifiers)
    expect(result).toBeUndefined()
  })

  test('findIn returns undefined for empty/undefined array', () => {
    expect(VideoCallRoomIdentifier.findIn(undefined)).toBeUndefined()
    expect(VideoCallRoomIdentifier.findIn([])).toBeUndefined()
  })
})
