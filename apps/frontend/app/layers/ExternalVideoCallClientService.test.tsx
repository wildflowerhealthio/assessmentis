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
  const mockOrgWithDailyCo: Org = {
    slug: OrgSlug.make('test-org'),
    frontendConfig: {
      fhirServer: { _tag: 'not_implemented' },
      videoCallClient: {
        _tag: 'daily_co_proxy',
        videoRoomProxyUrl: 'https://test.example.com/video',
      },
    },
  }

  const mockOrgNotImplemented: Org = {
    slug: OrgSlug.make('test-org'),
    frontendConfig: {
      fhirServer: { _tag: 'not_implemented' },
      videoCallClient: { _tag: 'not_implemented' },
    },
  }

  const mockAuthService: typeof AuthDataService.Service = {
    authData: Effect.succeed({
      uid: 'test-user',
      getIdToken: async () => 'test-token',
    } as any),
    authDataStream: {} as any,
    shutdown: Effect.void,
  }

  it('property: service structure and config handling', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(mockOrgWithDailyCo, mockOrgNotImplemented),
        fc.webUrl(),
        async (baseOrg, videoRoomProxyUrl) => {
          // Test with property-generated URL for daily_co
          const testOrg: Org = baseOrg.frontendConfig.videoCallClient._tag === 'daily_co_proxy'
            ? {
                ...baseOrg,
                frontendConfig: {
                  ...baseOrg.frontendConfig,
                  videoCallClient: {
                    _tag: 'daily_co_proxy',
                    videoRoomProxyUrl,
                  },
                },
              }
            : baseOrg

          const service = await Effect.runPromise(
            startExternalVideoCallClientService(
              mockAuthService,
              Effect.succeed(testOrg)
            )
          )

          // Service always created with client property
          expect(service).toBeDefined()
          expect(service).toHaveProperty('client')
          expect(Effect.isEffect(service.client)).toBe(true)
          expect(Object.keys(service)).toEqual(['client'])
          expect(ExternalVideoCallClientService.key).toBe('ExternalVideoCallClientService')

          // Verify client behavior based on config
          const clientResult = await Effect.runPromiseExit(service.client)
          
          if (testOrg.frontendConfig.videoCallClient._tag === 'not_implemented') {
            expect(Exit.isFailure(clientResult)).toBe(true)
            if (Exit.isFailure(clientResult)) {
              const error = Cause.squash(clientResult.cause) as any
              expect(error._tag).toBe('UnhandledError')
              expect(error.message).toContain('not yet implemented')
            }
          }
        }
      )
    )
  })

  it('property: error propagation from org service', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          new NoSelectedOrgError({ message: 'No org' }),
          new UnhandledError({ message: 'Unhandled' })
        ),
        async (orgError) => {
          const service = await Effect.runPromise(
            startExternalVideoCallClientService(
              mockAuthService,
              Effect.fail(orgError as any)
            )
          )

          const clientResult = await Effect.runPromiseExit(service.client)
          expect(Exit.isFailure(clientResult)).toBe(true)
        }
      )
    )
  })
})
