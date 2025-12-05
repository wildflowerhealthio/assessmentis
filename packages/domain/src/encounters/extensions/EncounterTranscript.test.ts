import { expect, test, describe } from 'vitest'
import {
  EncounterTranscriptExtension,
  getTranscripts,
  withTranscripts,
  encounterTranscriptUrl,
} from './EncounterTranscript'
import { Schema, Either } from 'effect'

describe('EncounterTranscript extension', () => {
  test('Schema encodes correctly', () => {
    const encode = Schema.encodeUnknownEither(EncounterTranscriptExtension)
    const result = encode({
      url: encounterTranscriptUrl,
      valueUrl: 'https://example.com/transcript/123',
    })

    expect(result).toStrictEqual(
      Either.right({
        url: encounterTranscriptUrl,
        valueUrl: 'https://example.com/transcript/123',
      })
    )
  })

  test('getTranscripts returns all transcript URLs', () => {
    const encounter = {
      extension: [
        { url: encounterTranscriptUrl, valueUrl: 'transcript-1' },
        { url: 'other-url', valueUrl: 'other-value' },
      ],
    }

    expect(getTranscripts(encounter)).toEqual(['transcript-1'])
  })

  test('getTranscripts returns empty array when no transcripts', () => {
    const encounter = {
      extension: [{ url: 'other-url', valueUrl: 'other-value' }],
    }

    expect(getTranscripts(encounter)).toEqual([])
  })

  test('withTranscripts adds transcript URLs', () => {
    const encounter = { extension: [] }

    const result = withTranscripts(encounter, ['transcript-1'])

    expect(result.extension).toHaveLength(1)
    expect(result.extension[0]).toEqual({
      url: encounterTranscriptUrl,
      valueUrl: 'transcript-1',
    })
  })

  test('withTranscripts replaces existing transcripts', () => {
    const encounter = {
      extension: [{ url: encounterTranscriptUrl, valueUrl: 'old-transcript' }],
    }

    const result = withTranscripts(encounter, ['new-transcript'])

    expect(result.extension).toHaveLength(1)
    expect(result.extension[0].valueUrl).toBe('new-transcript')
  })

  test('withTranscripts removes transcripts when empty array', () => {
    const encounter = {
      extension: [{ url: encounterTranscriptUrl, valueUrl: 'transcript-1' }],
    }

    const result = withTranscripts(encounter, [])

    expect(result.extension).toHaveLength(0)
  })
})
