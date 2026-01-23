import { describe, it, expect } from 'vitest'
import { Effect, Exit, Cause } from 'effect'
import { createFhirResponseHandlers } from './FhirResponseHandlers'

type MockResponseType =
  | 'Success'
  | 'Unauthenticated'
  | 'Unauthorized'
  | 'NotFound'
  | 'Gone'
  | 'Unhandled'

const createMockRequest = () => ({
  isNotFound: (resp: MockResponseType) =>
    resp === 'NotFound' || resp === 'Gone',
  isUnauthenticated: (resp: MockResponseType) => resp === 'Unauthenticated',
  isUnauthorized: (resp: MockResponseType) => resp === 'Unauthorized',
  isSuccess: (resp: MockResponseType): resp is 'Success' => resp === 'Success',
})

describe('FhirResponseHandlers', () => {
  describe('createFhirResponseHandlers', () => {
    const handlers = createFhirResponseHandlers<
      MockResponseType,
      MockResponseType,
      'Success'
    >(createMockRequest())

    const resourceParams = { resourceType: 'Patient', id: 'patient-123' }

    const expectSuccess = async (result: Exit.Exit<unknown, unknown>) => {
      expect(Exit.isSuccess(result)).toBe(true)
      if (Exit.isSuccess(result)) {
        expect(result.value).toBe('Success')
      }
    }

    const expectError = async (
      result: Exit.Exit<unknown, unknown>,
      expectedTag: string
    ) => {
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as { _tag: string }
        expect(error._tag).toBe(expectedTag)
      }
    }

    const expectNotFoundError = async (result: Exit.Exit<unknown, unknown>) => {
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as {
          _tag: string
          resourceType: string
          params: { id: string }
        }
        expect(error._tag).toBe('NotFoundError')
        expect(error.resourceType).toBe('Patient')
        expect(error.params).toEqual({ id: 'patient-123' })
      }
    }

    describe('handleReadResponse', () => {
      it.each([
        ['Success', 'Success', expectSuccess],
        ['Unauthenticated', 'AuthError', expectError],
        ['Unauthorized', 'AuthzError', expectError],
        ['NotFound', 'NotFoundError', expectNotFoundError],
        ['Gone', 'NotFoundError', expectError],
        ['Unhandled', 'UnhandledError', expectError],
      ] as const)(
        'returns %s for %s response',
        async (response, expectedTag, assertFn) => {
          const result = await Effect.runPromiseExit(
            handlers.handleReadResponse(
              response as MockResponseType,
              resourceParams
            )
          )
          await assertFn(result, expectedTag)
        }
      )

      it('checks auth errors before not found errors', async () => {
        const conflictingHandlers = createFhirResponseHandlers<
          MockResponseType,
          MockResponseType,
          'Success'
        >({
          ...createMockRequest(),
          isNotFound: () => true,
          isUnauthenticated: () => true,
        })

        const result = await Effect.runPromiseExit(
          conflictingHandlers.handleReadResponse(
            'Unauthenticated',
            resourceParams
          )
        )
        await expectError(result, 'AuthError')
      })
    })

    describe('handleSearchResponse', () => {
      it.each([
        ['Success', 'Success', expectSuccess],
        ['Unauthenticated', 'AuthError', expectError],
        ['Unauthorized', 'AuthzError', expectError],
        ['NotFound', 'UnhandledError', expectError], // Search doesn't check NotFound
        ['Unhandled', 'UnhandledError', expectError],
      ] as const)(
        'returns %s for %s response',
        async (response, expectedTag, assertFn) => {
          const result = await Effect.runPromiseExit(
            handlers.handleSearchResponse(response as MockResponseType)
          )
          await assertFn(result, expectedTag)
        }
      )
    })

    describe('handleCreateResponse', () => {
      it.each([
        ['Success', 'Success', expectSuccess],
        ['Unauthenticated', 'AuthError', expectError],
        ['Unauthorized', 'AuthzError', expectError],
        ['NotFound', 'UnhandledError', expectError], // Create doesn't check NotFound
        ['Unhandled', 'UnhandledError', expectError],
      ] as const)(
        'returns %s for %s response',
        async (response, expectedTag, assertFn) => {
          const result = await Effect.runPromiseExit(
            handlers.handleCreateResponse(response as MockResponseType)
          )
          await assertFn(result, expectedTag)
        }
      )
    })

    describe('handleUpdateResponse', () => {
      it.each([
        ['Success', 'Success', expectSuccess],
        ['Unauthenticated', 'AuthError', expectError],
        ['Unauthorized', 'AuthzError', expectError],
        ['NotFound', 'NotFoundError', expectNotFoundError],
        ['Unhandled', 'UnhandledError', expectError],
      ] as const)(
        'returns %s for %s response',
        async (response, expectedTag, assertFn) => {
          const result = await Effect.runPromiseExit(
            handlers.handleUpdateResponse(
              response as MockResponseType,
              resourceParams
            )
          )
          await assertFn(result, expectedTag)
        }
      )
    })

    describe('handleDeleteResponse', () => {
      it.each([
        ['Success', 'Success', expectSuccess],
        ['Unauthenticated', 'AuthError', expectError],
        ['Unauthorized', 'AuthzError', expectError],
        ['NotFound', 'NotFoundError', expectNotFoundError],
        ['Gone', 'NotFoundError', expectError],
        ['Unhandled', 'UnhandledError', expectError],
      ] as const)(
        'returns %s for %s response',
        async (response, expectedTag, assertFn) => {
          const result = await Effect.runPromiseExit(
            handlers.handleDeleteResponse(
              response as MockResponseType,
              resourceParams
            )
          )
          await assertFn(result, expectedTag)
        }
      )
    })

    describe('handleExecuteBundleResponse', () => {
      it.each([
        ['Success', 'Success', expectSuccess],
        ['Unauthenticated', 'AuthError', expectError],
        ['Unauthorized', 'AuthzError', expectError],
        ['NotFound', 'UnhandledError', expectError], // ExecuteBundle doesn't check NotFound
        ['Unhandled', 'UnhandledError', expectError],
      ] as const)(
        'returns %s for %s response',
        async (response, expectedTag, assertFn) => {
          const result = await Effect.runPromiseExit(
            handlers.handleExecuteBundleResponse(response as MockResponseType)
          )
          await assertFn(result, expectedTag)
        }
      )
    })

    describe('error priority', () => {
      it.each([
        [
          'AuthError takes precedence over AuthzError',
          {
            isUnauthenticated: (): boolean => true,
            isUnauthorized: (): boolean => true,
          },
          'Unauthenticated' as MockResponseType,
          'AuthError',
        ],
        [
          'AuthzError takes precedence over NotFoundError',
          {
            isUnauthorized: (): boolean => true,
            isNotFound: (): boolean => true,
          },
          'Unauthorized' as MockResponseType,
          'AuthzError',
        ],
      ] as const)('%s', async (_, overrides, response, expectedTag) => {
        const conflictingHandlers = createFhirResponseHandlers<
          MockResponseType,
          MockResponseType,
          'Success'
        >({
          ...createMockRequest(),
          ...overrides,
        })

        const result = await Effect.runPromiseExit(
          conflictingHandlers.handleReadResponse(response, resourceParams)
        )
        await expectError(result, expectedTag)
      })
    })
  })
})
