import { expect, test, describe } from 'vitest'
import {
  EncounterRecordingExtension,
  getRecordings,
  withRecordings,
  encounterRecordingUrl,
} from './EncounterRecording'
import { Schema, Either } from 'effect'

describe('EncounterRecording extension', () => {
  test('Schema encodes correctly', () => {
    const encode = Schema.encodeUnknownEither(EncounterRecordingExtension as any)
    const result = encode({
      url: encounterRecordingUrl,
      valueUrl: 'api.daily.co/v1/recordings/123',
    })

    expect(result).toStrictEqual(
      Either.right({
        url: encounterRecordingUrl,
        valueUrl: 'api.daily.co/v1/recordings/123',
      })
    )
  })

  test('getRecordings returns all recording URLs', () => {
    const encounter = {
      extension: [
        { url: encounterRecordingUrl, valueUrl: 'recording-1' },
        { url: encounterRecordingUrl, valueUrl: 'recording-2' },
        { url: 'other-url', valueUrl: 'other-value' },
      ],
    }

    expect(getRecordings(encounter)).toEqual(['recording-1', 'recording-2'])
  })

  test('getRecordings returns empty array when no recordings', () => {
    const encounter = {
      extension: [{ url: 'other-url', valueUrl: 'other-value' }],
    }

    expect(getRecordings(encounter)).toEqual([])
  })

  test('withRecordings adds multiple recording URLs', () => {
    const encounter = {
      extension: [{ url: 'other-url', valueUrl: 'other-value' }],
    }

    const result = withRecordings(encounter, ['recording-1', 'recording-2'])

    expect(result.extension).toHaveLength(3)
    expect(result.extension).toContainEqual({
      url: encounterRecordingUrl,
      valueUrl: 'recording-1',
    })
    expect(result.extension).toContainEqual({
      url: encounterRecordingUrl,
      valueUrl: 'recording-2',
    })
  })

  test('withRecordings replaces existing recordings', () => {
    const encounter = {
      extension: [
        { url: encounterRecordingUrl, valueUrl: 'old-recording' },
        { url: 'other-url', valueUrl: 'other-value' },
      ],
    }

    const result = withRecordings(encounter, ['new-recording'])

    const recordings = result.extension.filter(
      (ext: any) => ext.url === encounterRecordingUrl
    )
    expect(recordings).toHaveLength(1)
    expect(recordings[0].valueUrl).toBe('new-recording')
  })

  test('withRecordings removes all recordings when empty array', () => {
    const encounter = {
      extension: [{ url: encounterRecordingUrl, valueUrl: 'recording-1' }],
    }

    const result = withRecordings(encounter, [])

    expect(result.extension).toHaveLength(0)
  })
})
