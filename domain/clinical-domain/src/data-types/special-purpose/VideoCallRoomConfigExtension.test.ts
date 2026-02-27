import { expect, test, describe } from 'vitest'
import { DateTime } from 'effect'
import {
  makeVideoCallRoomConfigExtension,
  parseVideoCallRoomConfigExtension,
  findVideoCallRoomConfig,
  VIDEO_CALL_ROOM_CONFIG_URL,
} from './VideoCallRoomConfigExtension'
import { Extension } from './Extension'

describe('VideoCallRoomConfigExtension', () => {
  test('round-trip: make then parse preserves all fields', () => {
    const expiresAt = DateTime.unsafeMake('2025-01-01T00:00:00Z')
    const ext = makeVideoCallRoomConfigExtension({
      expiresAt,
      enableRecording: true,
      enableChat: false,
    })

    const parsed = parseVideoCallRoomConfigExtension(ext)
    expect(parsed).toBeDefined()
    expect(parsed!.expiresAt).toEqual(expiresAt)
    expect(parsed!.enableRecording).toBe(true)
    expect(parsed!.enableChat).toBe(false)
  })

  test('round-trip with partial fields', () => {
    const ext = makeVideoCallRoomConfigExtension({
      enableRecording: true,
    })

    const parsed = parseVideoCallRoomConfigExtension(ext)
    expect(parsed).toBeDefined()
    expect(parsed!.expiresAt).toBeUndefined()
    expect(parsed!.enableRecording).toBe(true)
    expect(parsed!.enableChat).toBeUndefined()
  })

  test('round-trip with empty config', () => {
    const ext = makeVideoCallRoomConfigExtension({})

    const parsed = parseVideoCallRoomConfigExtension(ext)
    expect(parsed).toBeDefined()
    expect(parsed!.expiresAt).toBeUndefined()
    expect(parsed!.enableRecording).toBeUndefined()
    expect(parsed!.enableChat).toBeUndefined()
  })

  test('parse returns undefined for non-matching extension', () => {
    const ext = Extension.make({
      definitionUrl: 'http://other-url',
    })
    const parsed = parseVideoCallRoomConfigExtension(ext)
    expect(parsed).toBeUndefined()
  })

  test('extension has correct definitionUrl', () => {
    const ext = makeVideoCallRoomConfigExtension({
      enableChat: true,
    })
    expect(ext.definitionUrl).toBe(VIDEO_CALL_ROOM_CONFIG_URL)
  })

  test('findVideoCallRoomConfig finds matching in array', () => {
    const other = Extension.make({ definitionUrl: 'http://other' })
    const roomConfig = makeVideoCallRoomConfigExtension({
      enableRecording: true,
    })

    const result = findVideoCallRoomConfig([other, roomConfig])
    expect(result).toBeDefined()
    expect(result!.enableRecording).toBe(true)
  })

  test('findVideoCallRoomConfig returns undefined when not present', () => {
    const other = Extension.make({ definitionUrl: 'http://other' })
    expect(findVideoCallRoomConfig([other])).toBeUndefined()
    expect(findVideoCallRoomConfig(undefined)).toBeUndefined()
    expect(findVideoCallRoomConfig([])).toBeUndefined()
  })
})
