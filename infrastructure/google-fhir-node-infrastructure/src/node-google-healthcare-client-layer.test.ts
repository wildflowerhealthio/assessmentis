import { it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, vi } from 'vitest'

import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import { FhirR4Client, buildFhirStoreParent } from '@assessmentis/fhir-r4'
import { FirebaseAdmin } from '@assessmentis/firebase-server-infrastructure'

import { NodeGoogleHealthcareFhirR4ClientLayer } from './node-google-healthcare-client-layer'

// Use vi.hoisted to ensure mocks are available and configured before vi.mock runs
const { mockRead, mockSearchType, mockCreate, mockUpdate, mockDelete, mockExecuteBundle } =
  vi.hoisted(() => {
    // Set up dynamic mock implementations that always return based on inputs
    const mockRead = vi.fn().mockImplementation(async ({ name }: { name: string }) => {
      const parts = name.split('/')
      const id = parts.pop()
      const resourceType = parts.pop()
      return {
        data: { resourceType, id },
        status: 200,
      }
    })

    const mockSearchType = vi.fn().mockImplementation(async () => ({
      status: 200,
      data: {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      },
    }))

    const mockCreate = vi
      .fn()
      .mockImplementation(async ({ requestBody }: { requestBody: any }) => ({
        status: 201,
        data: { ...requestBody, id: 'created-id' },
      }))

    const mockUpdate = vi
      .fn()
      .mockImplementation(async ({ name, requestBody }: { name: string; requestBody: any }) => {
        const id = name.split('/').pop()
        return {
          data: { ...requestBody, id },
          status: 200,
        }
      })

    const mockDelete = vi.fn().mockImplementation(async () => ({
      status: 200,
      data: {},
    }))

    const mockExecuteBundle = vi
      .fn()
      .mockImplementation(async ({ requestBody }: { requestBody: any }) => ({
        status: 200,
        data: {
          resourceType: 'Bundle',
          type: 'transaction-response',
          entry:
            requestBody.entry?.map(() => ({
              response: { status: '201 Created' },
            })) ?? [],
        },
      }))

    return {
      mockCreate,
      mockDelete,
      mockExecuteBundle,
      mockRead,
      mockSearchType,
      mockUpdate,
    }
  })

vi.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: vi.fn(),
    },
    healthcare: vi.fn(() => ({
      projects: {
        locations: {
          datasets: {
            fhirStores: {
              fhir: {
                read: mockRead,
                searchType: mockSearchType,
                create: mockCreate,
                update: mockUpdate,
                delete: mockDelete,
                executeBundle: mockExecuteBundle,
              },
            },
          },
        },
      },
    })),
  },
}))

vi.mock('firebase-admin/app', () => ({
  getApp: vi.fn(() => ({ name: '[DEFAULT]' })),
  initializeApp: vi.fn(),
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({})),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    settings: vi.fn(),
  })),
}))

/**
 * These tests verify that NodeGoogleHealthcareFhirR4ClientLayer correctly:
 * 1. Constructs the Google Healthcare API paths
 * 2. Calls the correct API methods with expected parameters
 * 3. Transforms successful responses correctly
 *
 * Error handling logic is thoroughly tested in FhirResponseHandlers.test.ts
 * which tests the handlers in isolation with fully mocked responses.
 *
 * Note: Effect layers memoize their construction. We test all operations
 * in a single test to work with this behavior, using property-based testing
 * to verify the layer works with various input combinations.
 */
describe('NodeGoogleHealthcareClientLayer', () => {
  // Arbitraries for property-based testing
  const fhirResourceTypeArb = fc.constantFrom(
    'Patient',
    'Observation',
    'Encounter',
    'Condition',
    'Procedure',
    'DiagnosticReport',
    'MedicationRequest'
  )

  const fhirIdArb = fc.stringMatching(/^[A-Za-z0-9\-.]{1,64}$/)

  const searchParamsArb = fc.dictionary(
    fc.constantFrom('_count', '_sort', 'subject', 'patient', 'code', 'category'),
    fc.string({ maxLength: 100, minLength: 1 })
  )

  // Generate test data upfront using fast-check sample
  const testInputs = fc.sample(
    fc.record({
      bundleResourceTypes: fc.array(fhirResourceTypeArb, {
        minLength: 1,
        maxLength: 5,
      }),
      createResource: fc.record({
        resourceType: fhirResourceTypeArb,
      }),
      deleteResource: fc.record({
        resourceType: fhirResourceTypeArb,
        id: fhirIdArb,
      }),
      readResource: fc.record({
        resourceType: fhirResourceTypeArb,
        id: fhirIdArb,
      }),
      searchResourceType: fhirResourceTypeArb,
      searchWithParams: fc.record({
        resourceType: fhirResourceTypeArb,
        params: searchParamsArb.filter((p) => Object.keys(p).length > 0),
      }),
      updateResource: fc.record({
        resourceType: fhirResourceTypeArb,
        id: fhirIdArb,
      }),
    }),
    20
  )

  const testConfig = {
    _tag: 'google_fhir_store' as const,
    dataset: 'test-dataset',
    projectId: 'test-project',
    region: 'us-central1',
    storeId: 'test-store',
  }

  const expectedParent = buildFhirStoreParent(testConfig)

  const testLayer = NodeGoogleHealthcareFhirR4ClientLayer.pipe(
    Layer.provide(Layer.succeed(LoadedGoogleFhirConfig, testConfig)),
    Layer.provide(Layer.succeed(FirebaseAdmin, vi.mocked({} as any)))
  )

  it.effect('provides FhirR4Client that correctly constructs API paths for all operations', () =>
    Effect.gen(function* () {
      const client = yield* FhirR4Client

      const results: {
        operation: string
        input: any
        success: boolean
      }[] = []

      // Test each generated input set
      for (const input of testInputs) {
        // Test read
        const readResult = yield* client.read({
          domainType: input.readResource.resourceType,
          id: input.readResource.id,
        })
        results.push({
          input: input.readResource,
          operation: 'read',
          success:
            readResult !== null && typeof readResult === 'object' && 'resourceType' in readResult,
        })

        // Test search without params
        yield* client.search({ domainType: input.searchResourceType })
        results.push({
          input: { domainType: input.searchResourceType },
          operation: 'searchWithoutParams',
          success: true,
        })

        // Test search with params
        yield* client.search({
          domainType: input.searchWithParams.resourceType,
          ...input.searchWithParams.params,
        })
        results.push({
          input: input.searchWithParams,
          operation: 'searchWithParams',
          success: true,
        })

        // Test create
        const resource = {
          name: [{ given: ['Test'] }],
          resourceType: input.createResource.resourceType,
        }
        const createResult = yield* client.create({
          domainType: input.createResource.resourceType,
          resource,
        })
        results.push({
          input: input.createResource,
          operation: 'create',
          success:
            createResult !== null && typeof createResult === 'object' && 'id' in createResult,
        })

        // Test update
        const updateResource = {
          id: input.updateResource.id,
          resourceType: input.updateResource.resourceType,
        }
        yield* client.update({
          domainType: input.updateResource.resourceType,
          id: input.updateResource.id,
          resource: updateResource,
        })
        results.push({
          input: input.updateResource,
          operation: 'update',
          success: true,
        })

        // Test delete
        yield* client.delete({
          domainType: input.deleteResource.resourceType,
          id: input.deleteResource.id,
        })
        results.push({
          input: input.deleteResource,
          operation: 'delete',
          success: true,
        })

        // Test executeBundle
        const bundle = {
          entry: input.bundleResourceTypes.map((rt) => ({
            request: { method: 'POST', url: rt },
            resource: { resourceType: rt },
          })),
          resourceType: 'Bundle' as const,
          type: 'transaction' as const,
        }
        const bundleResult = yield* client.executeBundle(bundle as any)
        results.push({
          input: { resourceTypes: input.bundleResourceTypes },
          operation: 'executeBundle',
          success:
            bundleResult !== null &&
            typeof bundleResult === 'object' &&
            'type' in bundleResult &&
            (bundleResult as any).type === 'transaction-response',
        })
      }

      // Verify all operations succeeded
      for (const r of results) {
        expect(r.success).toBe(true)
      }

      // Verify API paths were constructed correctly for each test input
      for (const input of testInputs) {
        // Verify read path
        expect(mockRead).toHaveBeenCalledWith({
          name: `${expectedParent}/fhir/${input.readResource.resourceType}/${input.readResource.id}`,
        })

        // Verify search without params
        expect(mockSearchType).toHaveBeenCalledWith(
          { parent: expectedParent, resourceType: input.searchResourceType },
          undefined
        )

        // Verify search with params
        expect(mockSearchType).toHaveBeenCalledWith(
          {
            parent: expectedParent,
            requestBody: {
              resourceType: input.searchWithParams.resourceType,
            },
            resourceType: input.searchWithParams.resourceType,
          },
          { params: input.searchWithParams.params }
        )

        // Verify create
        expect(mockCreate).toHaveBeenCalledWith({
          parent: expectedParent,
          requestBody: {
            resourceType: input.createResource.resourceType,
            name: [{ given: ['Test'] }],
          },
          type: input.createResource.resourceType,
        })

        // Verify update path
        expect(mockUpdate).toHaveBeenCalledWith({
          name: `${expectedParent}/fhir/${input.updateResource.resourceType}/${input.updateResource.id}`,
          requestBody: {
            id: input.updateResource.id,
            resourceType: input.updateResource.resourceType,
          },
        })

        // Verify delete path
        expect(mockDelete).toHaveBeenCalledWith({
          name: `${expectedParent}/fhir/${input.deleteResource.resourceType}/${input.deleteResource.id}`,
        })

        // Verify executeBundle
        expect(mockExecuteBundle).toHaveBeenCalledWith({
          parent: expectedParent,
          requestBody: {
            entry: input.bundleResourceTypes.map((rt) => ({
              request: { method: 'POST', url: rt },
              resource: { resourceType: rt },
            })),
            resourceType: 'Bundle',
            type: 'transaction',
          },
        })
      }

      // Verify total call counts match expected (20 inputs × operations)
      expect(mockRead).toHaveBeenCalledTimes(20)
      // 2 per input
      expect(mockSearchType).toHaveBeenCalledTimes(40)
      expect(mockCreate).toHaveBeenCalledTimes(20)
      expect(mockUpdate).toHaveBeenCalledTimes(20)
      expect(mockDelete).toHaveBeenCalledTimes(20)
      expect(mockExecuteBundle).toHaveBeenCalledTimes(20)
    }).pipe(Effect.provide(testLayer))
  )
})
