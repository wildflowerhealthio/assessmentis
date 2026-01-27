import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import { Effect, Exit } from 'effect'
import { FhirR4Client } from '@assessmentis/fhir-client'
import {
  LiveTestLayer,
  verifyGcloudAuth,
  testConfig,
} from '../setup/live.setup'
import { createTracker } from '../helpers/cleanup'

/**
 * Live E2E tests for Encounter search by location identifier.
 *
 * These tests verify that Encounters can be found by searching
 * for location.identifier, which is the mechanism used to match
 * video call room URLs to Encounters during recording sync.
 *
 * Prerequisites:
 * - gcloud auth login
 * - gcloud auth application-default login
 * - .env file with FHIR store configuration
 */
describe('Encounter search by location identifier (Live)', () => {
  const tracker = createTracker()

  beforeAll(() => {
    verifyGcloudAuth()
    console.log(
      `Testing against FHIR store: ${testConfig.projectId}/${testConfig.dataset}/${testConfig.storeId}`
    )
  })

  afterEach(async () => {
    if (tracker.count > 0) {
      await Effect.runPromise(
        tracker.cleanup().pipe(Effect.provide(LiveTestLayer))
      )
    }
  })

  it('should find an Encounter by location identifier value', async () => {
    const roomUrl = `https://example.daily.co/test-room-${Date.now()}`

    const program = Effect.gen(function* () {
      const client = yield* FhirR4Client

      // Create an Encounter with a location reference that has an identifier
      const created = yield* client.create({
        type: 'Encounter',
        resource: {
          resourceType: 'Encounter',
          status: 'finished',
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'VR',
            display: 'virtual',
          },
          location: [
            {
              location: {
                identifier: {
                  value: roomUrl,
                },
                display: 'Video call room',
              },
              status: 'completed',
            },
          ],
        },
      })

      const createdEncounter = created as { id: string; resourceType: string }
      tracker.track('Encounter', createdEncounter.id)

      // Search for Encounters by location identifier
      const searchResult = yield* client.search({
        resourceType: 'Encounter',
        'location:identifier': roomUrl,
      })

      return { createdEncounter, searchResult }
    }).pipe(Effect.provide(LiveTestLayer))

    const exit = await Effect.runPromiseExit(program)

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      const { createdEncounter, searchResult } = exit.value as {
        createdEncounter: { id: string; resourceType: string }
        searchResult: {
          resourceType: string
          type: string
          total?: number
          entry?: Array<{
            resource?: { id: string; resourceType: string }
          }>
        }
      }

      // Structural assertions on the search result
      expect(searchResult.resourceType).toBe('Bundle')
      expect(searchResult.type).toBe('searchset')

      // Verify our Encounter is in the results
      const matchingEntries = searchResult.entry?.filter(
        (entry) => entry.resource?.id === createdEncounter.id
      )
      expect(matchingEntries).toBeDefined()
      expect(matchingEntries!.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('should return empty results for non-existent location identifier', async () => {
    const nonExistentRoomUrl = `https://example.daily.co/non-existent-${Date.now()}`

    const program = Effect.gen(function* () {
      const client = yield* FhirR4Client

      return yield* client.search({
        resourceType: 'Encounter',
        'location:identifier': nonExistentRoomUrl,
      })
    }).pipe(Effect.provide(LiveTestLayer))

    const exit = await Effect.runPromiseExit(program)

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      const bundle = exit.value as {
        resourceType: string
        type: string
        total?: number
        entry?: unknown[]
      }

      expect(bundle.resourceType).toBe('Bundle')
      expect(bundle.type).toBe('searchset')
      // Should have no matching entries
      expect(bundle.entry ?? []).toHaveLength(0)
    }
  })
})
