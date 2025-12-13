import { expect, test, describe } from 'vitest'
import { Media, MediaStatus } from './Media'
import { Schema, Either } from 'effect'

describe('Media model', () => {
  test('Schema decodes minimal Media resource correctly', () => {
    const decode = Schema.decodeUnknownEither(Media)
    const result = decode({
      resourceType: 'Media',
      status: 'completed',
      content: {
        contentType: 'image/jpeg',
      },
    })

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.resourceType).toBe('Media')
      expect(result.right.status).toBe('completed')
      expect(result.right.content.contentType).toBe('image/jpeg')
    }
  })

  test('Schema decodes Media resource with all fields correctly', () => {
    const decode = Schema.decodeUnknownEither(Media)
    const result = decode({
      resourceType: 'Media',
      id: 'media-123',
      status: 'completed',
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/media-type',
            code: 'image',
            display: 'Image',
          },
        ],
      },
      subject: {
        reference: 'Patient/123',
      },
      createdDateTime: '2024-01-15T10:30:00Z',
      operator: {
        reference: 'Practitioner/456',
      },
      deviceName: 'Canon EOS 5D',
      height: 1080,
      width: 1920,
      content: {
        contentType: 'image/jpeg',
        url: 'https://example.com/media/image.jpg',
        title: 'Patient photograph',
      },
    })

    if (Either.isLeft(result)) {
      console.error('Validation error:', result.left)
    }
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.resourceType).toBe('Media')
      expect(result.right.status).toBe('completed')
      expect(result.right.subject?.reference).toBe('Patient/123')
      expect(result.right.deviceName).toBe('Canon EOS 5D')
      expect(result.right.height).toBe(1080)
      expect(result.right.width).toBe(1920)
    }
  })

  test('Schema validates MediaStatus enum', () => {
    const encode = Schema.encodeUnknownEither(MediaStatus)
    
    expect(Either.isRight(encode('completed'))).toBe(true)
    expect(Either.isRight(encode('preparation'))).toBe(true)
    expect(Either.isRight(encode('in-progress'))).toBe(true)
    expect(Either.isRight(encode('invalid-status'))).toBe(false)
  })

  test('Schema requires status field', () => {
    const decode = Schema.decodeUnknownEither(Media)
    const result = decode({
      resourceType: 'Media',
      content: {
        contentType: 'image/jpeg',
      },
    })

    expect(Either.isLeft(result)).toBe(true)
  })

  test('Schema requires content field', () => {
    const decode = Schema.decodeUnknownEither(Media)
    const result = decode({
      resourceType: 'Media',
      status: 'completed',
    })

    expect(Either.isLeft(result)).toBe(true)
  })

  test('Schema decodes Media with video metadata', () => {
    const decode = Schema.decodeUnknownEither(Media)
    const result = decode({
      resourceType: 'Media',
      status: 'completed',
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/media-type',
            code: 'video',
            display: 'Video',
          },
        ],
      },
      duration: 300,
      frames: 7500,
      content: {
        contentType: 'video/mp4',
        url: 'https://example.com/media/video.mp4',
      },
    })

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.duration).toBe(300)
      expect(result.right.frames).toBe(7500)
      expect(result.right.content.contentType).toBe('video/mp4')
    }
  })

  test('Schema decodes Media with createdPeriod', () => {
    const decode = Schema.decodeUnknownEither(Media)
    const result = decode({
      resourceType: 'Media',
      status: 'completed',
      createdPeriod: {
        start: '2024-01-15T10:00:00Z',
        end: '2024-01-15T11:00:00Z',
      },
      content: {
        contentType: 'audio/mp3',
      },
    })

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      // Note: DateTimeUtc will be converted to DateTime object, not string
      expect(result.right.createdPeriod?.start).toBeDefined()
      expect(result.right.createdPeriod?.end).toBeDefined()
    }
  })

  test('Schema decodes Media with notes', () => {
    const decode = Schema.decodeUnknownEither(Media)
    const result = decode({
      resourceType: 'Media',
      status: 'completed',
      content: {
        contentType: 'image/jpeg',
      },
      note: [
        {
          text: 'Image shows clear view of the affected area',
          time: '2024-01-15T10:30:00Z',
        },
      ],
    })

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.note).toHaveLength(1)
      expect(result.right.note?.[0].text).toBe(
        'Image shows clear view of the affected area'
      )
    }
  })
})
