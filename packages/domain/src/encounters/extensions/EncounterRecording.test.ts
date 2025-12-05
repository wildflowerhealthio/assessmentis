import { expect, test, describe } from 'vitest'
import {
  EncounterRecordingFileExtension,
  getRecordingFileUrls,
  withRecordingFileUrls,
  encounterRecordingFileUrl,
} from './EncounterRecording'
import { Schema, Either } from 'effect'

describe('EncounterRecording extension', () => {
  test('Schema encodes correctly', () => {
    const encode = Schema.encodeUnknownEither(
      EncounterRecordingFileExtension as any
    )
    const result = encode({
      url: encounterRecordingFileUrl,
      valueUrl: 'api.daily.co/v1/recordings/123',
    })

    expect(result).toStrictEqual(
      Either.right({
        url: encounterRecordingFileUrl,
        valueUrl: 'api.daily.co/v1/recordings/123',
      })
    )
  })

  test('getRecordings returns all recording URLs', () => {
    const encounter = {
      extension: [
        { url: encounterRecordingFileUrl, valueUrl: 'recording-1' },
        { url: encounterRecordingFileUrl, valueUrl: 'recording-2' },
        { url: 'other-url', valueUrl: 'other-value' },
      ],
    }

    expect(getRecordingFileUrls(encounter)).toEqual([
      'recording-1',
      'recording-2',
    ])
  })

  test('getRecordings returns empty array when no recordings', () => {
    const encounter = {
      extension: [{ url: 'other-url', valueUrl: 'other-value' }],
    }

    expect(getRecordingFileUrls(encounter)).toEqual([])
  })

  test('withRecordings adds multiple recording URLs', () => {
    const encounter = {
      extension: [{ url: 'other-url', valueUrl: 'other-value' }],
    }

    const result = withRecordingFileUrls(encounter, [
      'recording-1',
      'recording-2',
    ])

    expect(result.extension).toHaveLength(3)
    expect(result.extension).toContainEqual({
      url: encounterRecordingFileUrl,
      valueUrl: 'recording-1',
    })
    expect(result.extension).toContainEqual({
      url: encounterRecordingFileUrl,
      valueUrl: 'recording-2',
    })
  })

  test('withRecordings replaces existing recordings', () => {
    const encounter = {
      extension: [
        { url: encounterRecordingFileUrl, valueUrl: 'old-recording' },
        { url: 'other-url', valueUrl: 'other-value' },
      ],
    }

    const result = withRecordingFileUrls(encounter, ['new-recording'])

    const recordings = result.extension.filter(
      (ext: any) => ext.url === encounterRecordingFileUrl
    )
    expect(recordings).toHaveLength(1)
    expect(recordings[0].valueUrl).toBe('new-recording')
  })

  test('withRecordings removes all recordings when empty array', () => {
    const encounter = {
      extension: [{ url: encounterRecordingFileUrl, valueUrl: 'recording-1' }],
    }

    const result = withRecordingFileUrls(encounter, [])

    expect(result.extension).toHaveLength(0)
  })
})
