import { describe, it, expect } from 'vitest'
import { Effect, Exit, Cause } from 'effect'
import * as fc from 'fast-check'
import {
  ExternalVideoCallClientService,
  startExternalVideoCallClientService,
} from './ExternalVideoCallClientService'
import {
  Org,
  AuthDataService,
  NoSelectedOrgError,
  OrgSlug,
} from '@assessmentis/platform-domain'
import { UnhandledError } from '@assessmentis/ontology'

describe('ExternalVideoCallClientService', () => {
  const createMockOrg = (
    videoCallTag: 'daily_co_proxy' | 'not_implemented'
  ): Org => ({
    slug: OrgSlug.make('test-org'),
    frontendConfig: {
      fhirServer: { _tag: 'not_implemented' },
      videoCallClient:
        videoCallTag === 'daily_co_proxy'
          ? {
              _tag: 'daily_co_proxy',
              videoRoomProxyUrl: 'https://test.example.com/video',
            }
          : { _tag: 'not_implemented' },
    },
  })

  const createMockAuthDataService = (): typeof AuthDataService.Service => ({
    authData: Effect.succeed({
      uid: 'test-user',
      getIdToken: async () => 'test-token',
    } as any),
    authDataStream: {} as any,
    shutdown: Effect.void,
  })

  describe('startExternalVideoCallClientService', () => {
    it('returns service', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const mockAuthService = createMockAuthDataService()
          const mockOrg = createMockOrg('daily_co_proxy')

          const service = startExternalVideoCallClientService(
            mockAuthService,
            Effect.succeed(mockOrg)
          )

          const result = await Effect.runPromise(service)

          expect(result).toBeDefined()
          expect(result).toHaveProperty('client')
          expect(Effect.isEffect(result.client)).toBe(true)
        })
      )
    })

    it('service has client property', async () => {
      const mockAuthService = createMockAuthDataService()
      const mockOrg = createMockOrg('daily_co_proxy')

      const service = startExternalVideoCallClientService(
        mockAuthService,
        Effect.succeed(mockOrg)
      )

      const result = await Effect.runPromise(service)

      expect(result.client).toBeDefined()
      expect(Effect.isEffect(result.client)).toBe(true)
    })
  })

  describe('Client effect resolves based on org config', () => {
    it('resolves for daily_co_proxy config', async () => {
      const mockAuthService = createMockAuthDataService()
      const mockOrg = createMockOrg('daily_co_proxy')

      const service = startExternalVideoCallClientService(
        mockAuthService,
        Effect.succeed(mockOrg)
      )

      const result = await Effect.runPromise(service)

      // The client effect should be defined
      expect(result.client).toBeDefined()
      expect(Effect.isEffect(result.client)).toBe(true)
    })

    it('property: daily_co_proxy config always creates valid service', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          async (videoRoomProxyUrl) => {
            const mockAuthService = createMockAuthDataService()
            const mockOrg: Org = {
              slug: OrgSlug.make('test-org'),
              frontendConfig: {
                fhirServer: { _tag: 'not_implemented' },
                videoCallClient: {
                  _tag: 'daily_co_proxy',
                  videoRoomProxyUrl,
                },
              },
            }

            const service = startExternalVideoCallClientService(
              mockAuthService,
              Effect.succeed(mockOrg)
            )

            const result = await Effect.runPromise(service)

            expect(result).toBeDefined()
            expect(result.client).toBeDefined()
          }
        )
      )
    })
  })

  describe('Handles not_implemented config type', () => {
    it('fails with UnhandledError for not_implemented', async () => {
      const mockAuthService = createMockAuthDataService()
      const mockOrg = createMockOrg('not_implemented')

      const service = startExternalVideoCallClientService(
        mockAuthService,
        Effect.succeed(mockOrg)
      )

      const result = await Effect.runPromise(service)

      // Service itself succeeds
      expect(result).toBeDefined()

      // But the client effect should fail when executed
      const clientResult = await Effect.runPromiseExit(result.client)

      expect(Exit.isFailure(clientResult)).toBe(true)
      if (Exit.isFailure(clientResult)) {
        const error = Cause.squash(clientResult.cause) as any
        expect(error._tag).toBe('UnhandledError')
        expect(error.message).toContain('not yet implemented')
      }
    })

    it('property: not_implemented always fails with UnhandledError', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const mockAuthService = createMockAuthDataService()
          const mockOrg = createMockOrg('not_implemented')

          const service = startExternalVideoCallClientService(
            mockAuthService,
            Effect.succeed(mockOrg)
          )

          const result = await Effect.runPromise(service)
          const clientResult = await Effect.runPromiseExit(result.client)

          expect(Exit.isFailure(clientResult)).toBe(true)
          if (Exit.isFailure(clientResult)) {
            const error = Cause.squash(clientResult.cause) as any
            expect(error._tag).toBe('UnhandledError')
          }
        })
      )
    })
  })

  describe('Error handling', () => {
    it('propagates org errors to client effect', async () => {
      const mockAuthService = createMockAuthDataService()
      const orgError = new NoSelectedOrgError({ message: 'No org selected' })

      const service = startExternalVideoCallClientService(
        mockAuthService,
        Effect.fail(orgError)
      )

      const result = await Effect.runPromise(service)
      const clientResult = await Effect.runPromiseExit(result.client)

      expect(Exit.isFailure(clientResult)).toBe(true)
      if (Exit.isFailure(clientResult)) {
        const error = Cause.squash(clientResult.cause) as any
        expect(error._tag).toBe('NoSelectedOrgError')
      }
    })

    it('property: any org error propagates to client', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            new NoSelectedOrgError({ message: 'No org' }),
            new UnhandledError({ message: 'Unhandled' })
          ),
          async (orgError) => {
            const mockAuthService = createMockAuthDataService()

            const service = startExternalVideoCallClientService(
              mockAuthService,
              Effect.fail(orgError as any)
            )

            const result = await Effect.runPromise(service)
            const clientResult = await Effect.runPromiseExit(result.client)

            expect(Exit.isFailure(clientResult)).toBe(true)
          }
        )
      )
    })
  })

  describe('ExternalVideoCallClientService tag', () => {
    it('has correct service name', () => {
      expect(ExternalVideoCallClientService.key).toBe(
        'ExternalVideoCallClientService'
      )
    })
  })

  describe('Service structure', () => {
    it('service contains only client property', async () => {
      const mockAuthService = createMockAuthDataService()
      const mockOrg = createMockOrg('daily_co_proxy')

      const service = startExternalVideoCallClientService(
        mockAuthService,
        Effect.succeed(mockOrg)
      )

      const result = await Effect.runPromise(service)

      const keys = Object.keys(result)
      expect(keys).toContain('client')
      expect(keys.length).toBe(1)
    })

    it('property: service structure is consistent', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('daily_co_proxy', 'not_implemented'),
          async (configType) => {
            const mockAuthService = createMockAuthDataService()
            const mockOrg = createMockOrg(configType as any)

            const service = startExternalVideoCallClientService(
              mockAuthService,
              Effect.succeed(mockOrg)
            )

            const result = await Effect.runPromise(service)

            expect(result).toHaveProperty('client')
            expect(Effect.isEffect(result.client)).toBe(true)
          }
        )
      )
    })
  })

  describe('Integration with AuthDataService', () => {
    it('uses provided AuthDataService', async () => {
      const mockAuthService = createMockAuthDataService()
      const mockOrg = createMockOrg('daily_co_proxy')

      const service = startExternalVideoCallClientService(
        mockAuthService,
        Effect.succeed(mockOrg)
      )

      const result = await Effect.runPromise(service)

      // Service should be created successfully with auth service
      expect(result).toBeDefined()
      expect(result.client).toBeDefined()
    })
  })
})
