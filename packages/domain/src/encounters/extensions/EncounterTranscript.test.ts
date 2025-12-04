import { expect, test, describe } from 'vitest'
import {
  EncounterTranscriptExtension,
  getTranscripts,
  getTranscript,
  withTranscripts,
  withTranscript,
  encounterTranscriptUrl,
} from './EncounterTranscript'
import { Schema, Either } from 'effect'

describe('EncounterTranscript extension', () => {
  test('Schema encodes correctly', () => {
    const encode = Schema.encodeEither(EncounterTranscriptExtension)
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

  test('getTranscript returns first transcript URL', () => {
    const encounter = {
      extension: [
        { url: encounterTranscriptUrl, valueUrl: 'transcript-1' },
      ],
    }

    expect(getTranscript(encounter)).toBe('transcript-1')
  })

  test('getTranscript returns undefined when no transcripts', () => {
    const encounter = {
      extension: [{ url: 'other-url', valueUrl: 'other-value' }],
    }

    expect(getTranscript(encounter)).toBeUndefined()
  })

  test('withTranscript adds transcript URL', () => {
    const encounter = { extension: [] }

    const result = withTranscript(encounter, 'transcript-1')

    expect(result.extension).toHaveLength(1)
    expect(result.extension[0]).toEqual({
      url: encounterTranscriptUrl,
      valueUrl: 'transcript-1',
    })
  })

  test('withTranscript replaces existing transcript', () => {
    const encounter = {
      extension: [
        { url: encounterTranscriptUrl, valueUrl: 'old-transcript' },
      ],
    }

    const result = withTranscript(encounter, 'new-transcript')

    expect(result.extension).toHaveLength(1)
    expect(result.extension[0].valueUrl).toBe('new-transcript')
  })

  test('withTranscript removes transcript when undefined', () => {
    const encounter = {
      extension: [
        { url: encounterTranscriptUrl, valueUrl: 'transcript-1' },
      ],
    }

    const result = withTranscript(encounter, undefined)

    expect(result.extension).toHaveLength(0)
  })
})
