import { expect, test, describe } from 'vitest'
import { Effect, Layer } from 'effect'
import { getEncounterRecordings } from './getEncounterRecordings'
import {
  MediaRepository,
  Media,
  MediaId,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { EncounterId } from '@assessmentis/clinical-domain/encounters'
import { WithId } from '@assessmentis/clinical-domain/general-purpose'
import { UnhandledError } from '@assessmentis/clinical-domain/errors'

describe('getEncounterRecordings', () => {
  test('returns Media resources linked to the encounter', async () => {
    const encounterId = EncounterId.make('test-encounter-123')

    const mockMedia: WithId<Media>[] = [
      {
        id: MediaId.make('media-1'),
        resourceType: 'Media',
        status: 'completed',
        encounter: {
          reference: `Encounter/${encounterId}`,
        },
        content: {
          url: 'https://example.com/recording1.mp4',
        },
      },
      {
        id: MediaId.make('media-2'),
        resourceType: 'Media',
        status: 'completed',
        encounter: {
          reference: 'Encounter/other-encounter',
        },
        content: {
          url: 'https://example.com/recording2.mp4',
        },
      },
      {
        id: MediaId.make('media-3'),
        resourceType: 'Media',
        status: 'completed',
        encounter: {
          reference: `Encounter/${encounterId}`,
        },
        content: {
          url: 'https://example.com/recording3.mp4',
        },
      },
    ]

    const mockMediaRepository = Layer.succeed(MediaRepository, {
      getMany: () => Effect.succeed(mockMedia),
      get: () => Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      create: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      createMany: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      update: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      delete: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
    })

    const result = await Effect.runPromise(
      getEncounterRecordings(encounterId).pipe(
        Effect.provide(mockMediaRepository)
      )
    )

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(MediaId.make('media-1'))
    expect(result[1].id).toBe(MediaId.make('media-3'))
    expect(result[0].content.url).toBe('https://example.com/recording1.mp4')
    expect(result[1].content.url).toBe('https://example.com/recording3.mp4')
  })

  test('returns empty array when no Media resources match', async () => {
    const encounterId = EncounterId.make('test-encounter-456')

    const mockMedia: WithId<Media>[] = [
      {
        id: MediaId.make('media-1'),
        resourceType: 'Media',
        status: 'completed',
        encounter: {
          reference: 'Encounter/other-encounter',
        },
        content: {
          url: 'https://example.com/recording1.mp4',
        },
      },
    ]

    const mockMediaRepository = Layer.succeed(MediaRepository, {
      getMany: () => Effect.succeed(mockMedia),
      get: () => Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      create: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      createMany: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      update: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      delete: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
    })

    const result = await Effect.runPromise(
      getEncounterRecordings(encounterId).pipe(
        Effect.provide(mockMediaRepository)
      )
    )

    expect(result).toHaveLength(0)
  })

  test('returns empty array when no Media resources exist', async () => {
    const encounterId = EncounterId.make('test-encounter-789')

    const mockMediaRepository = Layer.succeed(MediaRepository, {
      getMany: () => Effect.succeed([]),
      get: () => Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      create: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      createMany: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      update: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      delete: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
    })

    const result = await Effect.runPromise(
      getEncounterRecordings(encounterId).pipe(
        Effect.provide(mockMediaRepository)
      )
    )

    expect(result).toHaveLength(0)
  })
})
