import { expect } from 'vitest'
import type { Layer } from 'effect'
import { Exit, Cause, pipe, Option } from 'effect'
import type { FhirR4Client } from './FhirR4Client'
import { describeAsFhirR4ResourceClient } from './FhirR4Client.interface.test'

/**
 * Pre-configured test suite for Location resource compliance.
 * Includes test cases for searching by one of several identifiers (OR-style).
 */
export const describeAsFhirR4LocationClient = (
  FhirR4ClientLayer: Layer.Layer<FhirR4Client, never, never>
) =>
  describeAsFhirR4ResourceClient(FhirR4ClientLayer, 'Location', {
    nonExistentResourceId: 'non-existent-location-id-12345',

    createAndRead: {
      cases: [
        {
          name: 'a location with an identifier',
          resource: {
            resourceType: 'Location',
            name: 'Main Office',
            status: 'active',
            identifier: [
              {
                system: 'http://example.com/locations',
                value: 'loc-create-read-1',
              },
            ],
          },
        },
        {
          name: 'a location with multiple identifiers',
          resource: {
            resourceType: 'Location',
            name: 'Branch Office',
            status: 'active',
            identifier: [
              {
                system: 'http://example.com/locations',
                value: 'loc-create-read-2a',
              },
              {
                system: 'http://example.com/internal',
                value: 'loc-create-read-2b',
              },
            ],
          },
        },
      ],
      assertion: (input, output) => {
        const inputLocation = input as { resourceType: string }
        const outputLocation = output as { resourceType: string; id: string }
        expect(outputLocation.resourceType).toBe('Location')
        expect(outputLocation.id).toBeTruthy()
        expect(inputLocation.resourceType).toBe(outputLocation.resourceType)
      },
    },

    updateAndRead: {
      initial: {
        resourceType: 'Location',
        name: 'Before Update Location',
        status: 'active',
      },
      cases: [
        {
          name: 'updating the name',
          update: {
            resourceType: 'Location',
            name: 'After Update Location',
            status: 'active',
          },
        },
      ],
      assertion: (before, updateResponse, read) => {
        const beforeLocation = before as { id: string }
        const updatedLocation = updateResponse as {
          id: string
          resourceType: string
        }
        const readLocation = read as { id: string; resourceType: string }

        expect(updatedLocation.resourceType).toBe('Location')
        expect(updatedLocation.id).toBe(beforeLocation.id)
        expect(readLocation.id).toBe(beforeLocation.id)
      },
    },

    createDeleteRead: {
      cases: [
        {
          name: 'a location to delete',
          resource: {
            resourceType: 'Location',
            name: 'To Delete Location',
            status: 'active',
          },
        },
      ],
      assertion: (_resource, _deleteResult, readExit) => {
        expect(Exit.isFailure(readExit)).toBe(true)
        if (Exit.isFailure(readExit)) {
          const error = pipe(
            readExit,
            Exit.causeOption,
            Option.flatMap(Cause.failureOption),
            Option.getOrThrow
          )
          expect((error as { _tag: string })._tag).toBe('NotFoundError')
        }
      },
    },

    createManyAndSearch: {
      toCreate: [
        {
          resourceType: 'Location',
          name: 'Search Location Alpha',
          status: 'active',
          identifier: [
            {
              system: 'http://example.com/locations',
              value: 'search-loc-alpha',
            },
          ],
        },
        {
          resourceType: 'Location',
          name: 'Search Location Beta',
          status: 'active',
          identifier: [
            {
              system: 'http://example.com/locations',
              value: 'search-loc-beta',
            },
          ],
        },
        {
          resourceType: 'Location',
          name: 'Search Location Gamma',
          status: 'active',
          identifier: [
            {
              system: 'http://example.com/locations',
              value: 'search-loc-gamma',
            },
          ],
        },
      ],
      cases: [
        {
          params: { _count: '10' },
          name: 'searching all locations',
          assertion: (result) => {
            const bundle = result as {
              resourceType: string
              type: string
              total?: number
            }
            expect(bundle.resourceType).toBe('Bundle')
            expect(bundle.type).toBe('searchset')
          },
        },
        {
          params: {
            identifier: 'http://example.com/locations|search-loc-alpha',
          },
          name: 'searching by a single identifier',
          assertion: (result) => {
            const bundle = result as {
              resourceType: string
              type: string
              entry?: { resource: { name: string } }[]
            }
            expect(bundle.resourceType).toBe('Bundle')
            expect(bundle.type).toBe('searchset')
            expect(bundle.entry).toBeDefined()
            expect(bundle.entry!.length).toBeGreaterThanOrEqual(1)
            expect(bundle.entry![0].resource.name).toBe('Search Location Alpha')
          },
        },
        {
          params: {
            identifier: [
              'http://example.com/locations|search-loc-alpha',
              'http://example.com/locations|search-loc-beta',
            ],
          },
          name: 'searching by multiple identifiers (OR)',
          assertion: (result) => {
            const bundle = result as {
              resourceType: string
              type: string
              entry?: { resource: { name: string } }[]
            }
            expect(bundle.resourceType).toBe('Bundle')
            expect(bundle.type).toBe('searchset')
            expect(bundle.entry).toBeDefined()
            expect(bundle.entry!.length).toBeGreaterThanOrEqual(2)
            const names = bundle.entry!.map((e) => e.resource.name)
            expect(names).toContain('Search Location Alpha')
            expect(names).toContain('Search Location Beta')
          },
        },
      ],
    },
  })
