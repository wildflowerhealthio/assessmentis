import { describe, it, expect, vi } from 'vitest'
import { Effect, Exit, Layer } from 'effect'
import * as fc from 'fast-check'
import { FhirR4Client, buildFhirStoreParent } from '@assessmentis/fhir-client'
import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import { FirebaseAdmin } from '@assessmentis/firebase-server-infrastructure'

// Use vi.hoisted to ensure mocks are available and configured before vi.mock runs
const {
  mockRead,
  mockSearchType,
  mockCreate,
  mockUpdate,
  mockDelete,
  mockExecuteBundle,
} = vi.hoisted(() => {
  // Set up dynamic mock implementations that always return based on inputs
  const mockRead = vi.fn().mockImplementation(({ name }: { name: string }) => {
    const parts = name.split('/')
    const id = parts.pop()
    const resourceType = parts.pop()
    return Promise.resolve({
      status: 200,
      data: { resourceType, id },
    })
  })

  const mockSearchType = vi.fn().mockImplementation(() => {
    return Promise.resolve({
      status: 200,
      data: {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      },
    })
  })

  const mockCreate = vi
    .fn()
    .mockImplementation(({ requestBody }: { requestBody: any }) => {
      return Promise.resolve({
        status: 201,
        data: { ...requestBody, id: 'created-id' },
      })
    })

  const mockUpdate = vi
    .fn()
    .mockImplementation(
      ({ name, requestBody }: { name: string; requestBody: any }) => {
        const id = name.split('/').pop()
        return Promise.resolve({
          status: 200,
          data: { ...requestBody, id },
        })
      }
    )

  const mockDelete = vi.fn().mockImplementation(() => {
    return Promise.resolve({
      status: 200,
      data: {},
    })
  })

  const mockExecuteBundle = vi
    .fn()
    .mockImplementation(({ requestBody }: { requestBody: any }) => {
      return Promise.resolve({
        status: 200,
        data: {
          resourceType: 'Bundle',
          type: 'transaction-response',
          entry:
            requestBody.entry?.map(() => ({
              response: { status: '201 Created' },
            })) || [],
        },
      })
    })

  return {
    mockRead,
    mockSearchType,
    mockCreate,
    mockUpdate,
    mockDelete,
    mockExecuteBundle,
  }
})

vi.mock('googleapis', () => ({
  google: {
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
    auth: {
      GoogleAuth: vi.fn(),
    },
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

import { NodeGoogleHealthcareFhirR4ClientLayer } from './NodeGoogleHealthcareClientLayer'

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
    fc.constantFrom(
      '_count',
      '_sort',
      'subject',
      'patient',
      'code',
      'category'
    ),
    fc.string({ minLength: 1, maxLength: 100 })
  )

  // Generate test data upfront using fast-check sample
  const testInputs = fc.sample(
    fc.record({
      readResource: fc.record({
        resourceType: fhirResourceTypeArb,
        id: fhirIdArb,
      }),
      searchResourceType: fhirResourceTypeArb,
      searchWithParams: fc.record({
        resourceType: fhirResourceTypeArb,
        params: searchParamsArb.filter((p) => Object.keys(p).length > 0),
      }),
      createResource: fc.record({
        resourceType: fhirResourceTypeArb,
      }),
      updateResource: fc.record({
        resourceType: fhirResourceTypeArb,
        id: fhirIdArb,
      }),
      deleteResource: fc.record({
        resourceType: fhirResourceTypeArb,
        id: fhirIdArb,
      }),
      bundleResourceTypes: fc.array(fhirResourceTypeArb, {
        minLength: 1,
        maxLength: 5,
      }),
    }),
    20
  )

  const testConfig = {
    _tag: 'google_fhir_store' as const,
    apiKey: null,
    projectId: 'test-project',
    region: 'us-central1',
    dataset: 'test-dataset',
    storeId: 'test-store',
  }

  const expectedParent = buildFhirStoreParent(testConfig)

  const testLayer = NodeGoogleHealthcareFhirR4ClientLayer.pipe(
    Layer.provide(Layer.succeed(LoadedGoogleFhirConfig, testConfig)),
    Layer.provide(FirebaseAdmin.Default)
  )

  it('provides FhirR4Client that correctly constructs API paths for all operations', async () => {
    const program = Effect.gen(function* () {
      const client = yield* FhirR4Client

      const results: Array<{
        operation: string
        input: any
        success: boolean
      }> = []

      // Test each generated input set
      for (const input of testInputs) {
        // Test read
        const readResult = yield* client.read({
          resourceType: input.readResource.resourceType,
          id: input.readResource.id,
        })
        results.push({
          operation: 'read',
          input: input.readResource,
          success:
            readResult !== null &&
            typeof readResult === 'object' &&
            'resourceType' in readResult,
        })

        // Test search without params
        yield* client.search({ resourceType: input.searchResourceType })
        results.push({
          operation: 'searchWithoutParams',
          input: { resourceType: input.searchResourceType },
          success: true,
        })

        // Test search with params
        yield* client.search({
          resourceType: input.searchWithParams.resourceType,
          ...input.searchWithParams.params,
        })
        results.push({
          operation: 'searchWithParams',
          input: input.searchWithParams,
          success: true,
        })

        // Test create
        const resource = {
          resourceType: input.createResource.resourceType,
          name: [{ given: ['Test'] }],
        }
        const createResult = yield* client.create({
          type: input.createResource.resourceType,
          resource,
        })
        results.push({
          operation: 'create',
          input: input.createResource,
          success:
            createResult !== null &&
            typeof createResult === 'object' &&
            'id' in createResult,
        })

        // Test update
        const updateResource = {
          resourceType: input.updateResource.resourceType,
          id: input.updateResource.id,
        }
        yield* client.update({
          id: input.updateResource.id,
          type: input.updateResource.resourceType,
          resource: updateResource,
        })
        results.push({
          operation: 'update',
          input: input.updateResource,
          success: true,
        })

        // Test delete
        yield* client.delete({
          id: input.deleteResource.id,
          type: input.deleteResource.resourceType,
        })
        results.push({
          operation: 'delete',
          input: input.deleteResource,
          success: true,
        })

        // Test executeBundle
        const bundle = {
          resourceType: 'Bundle' as const,
          type: 'transaction' as const,
          entry: input.bundleResourceTypes.map((rt) => ({
            request: { method: 'POST', url: rt },
            resource: { resourceType: rt },
          })),
        }
        const bundleResult = yield* client.executeBundle(bundle as any)
        results.push({
          operation: 'executeBundle',
          input: { resourceTypes: input.bundleResourceTypes },
          success:
            bundleResult !== null &&
            typeof bundleResult === 'object' &&
            'type' in bundleResult &&
            (bundleResult as any).type === 'transaction-response',
        })
      }

      return results
    }).pipe(Effect.provide(testLayer))

    const result = await Effect.runPromiseExit(program)

    expect(Exit.isSuccess(result)).toBe(true)
    if (Exit.isSuccess(result)) {
      // Verify all operations succeeded
      for (const r of result.value) {
        expect(r.success).toBe(true)
      }
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
          resourceType: input.searchWithParams.resourceType,
          requestBody: { resourceType: input.searchWithParams.resourceType },
        },
        { params: input.searchWithParams.params }
      )

      // Verify create
      expect(mockCreate).toHaveBeenCalledWith({
        parent: expectedParent,
        type: input.createResource.resourceType,
        requestBody: {
          resourceType: input.createResource.resourceType,
          name: [{ given: ['Test'] }],
        },
      })

      // Verify update path
      expect(mockUpdate).toHaveBeenCalledWith({
        name: `${expectedParent}/fhir/${input.updateResource.resourceType}/${input.updateResource.id}`,
        requestBody: {
          resourceType: input.updateResource.resourceType,
          id: input.updateResource.id,
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
          resourceType: 'Bundle',
          type: 'transaction',
          entry: input.bundleResourceTypes.map((rt) => ({
            request: { method: 'POST', url: rt },
            resource: { resourceType: rt },
          })),
        },
      })
    }

    // Verify total call counts match expected (20 inputs × operations)
    expect(mockRead).toHaveBeenCalledTimes(20)
    expect(mockSearchType).toHaveBeenCalledTimes(40) // 2 per input
    expect(mockCreate).toHaveBeenCalledTimes(20)
    expect(mockUpdate).toHaveBeenCalledTimes(20)
    expect(mockDelete).toHaveBeenCalledTimes(20)
    expect(mockExecuteBundle).toHaveBeenCalledTimes(20)
  })
})
