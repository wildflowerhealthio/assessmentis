import { describe, it, expect } from 'vitest'
import { Effect, Exit, Cause, Option, pipe, Arbitrary } from 'effect'
import * as fc from 'fast-check'
import {
  ExternalVideoCallClientService,
  startExternalVideoCallClientService,
} from './ExternalVideoCallClientService'
import {
  Org,
  AuthDataService,
  NoSelectedOrgError,
} from '@assessmentis/platform-domain'
import { UnhandledError } from '@assessmentis/ontology'
import { neverUsedMock } from '@assessmentis/util'

// Generate arbitrary Org values using the schema
const orgArb = Arbitrary.make(Org)

describe('ExternalVideoCallClientService', () => {
  const mockAuthService: typeof AuthDataService.Service = {
    authData: Effect.succeed({
      uid: 'test-user',
      getIdToken: async () => 'test-token',
    } as any),
    authDataStream: neverUsedMock('authDataStream'),
    shutdown: Effect.void,
  }

  it('property: service structure and config handling', async () => {
    await fc.assert(
      fc.asyncProperty(orgArb, async (org) => {
        const service = await Effect.runPromise(
          startExternalVideoCallClientService(
            mockAuthService,
            Effect.succeed(org)
          )
        )

        // Service always created with client property
        expect(service).toBeDefined()
        expect(service).toHaveProperty('client')
        expect(Effect.isEffect(service.client)).toBe(true)
        expect(Object.keys(service)).toEqual(['client'])
        expect(ExternalVideoCallClientService.key).toBe(
          'ExternalVideoCallClientService'
        )

        // Verify client behavior based on config
        const clientResult = await Effect.runPromiseExit(service.client)

        if (org.frontendConfig.videoCallClient._tag === 'not_implemented') {
          expect(Exit.isFailure(clientResult)).toBe(true)
          const error = pipe(
            clientResult,
            Exit.causeOption,
            Option.flatMap(Cause.failureOption),
            Option.getOrThrow
          )
          expect(error._tag).toBe('UnhandledError')
          expect((error as UnhandledError).message).toContain(
            'not yet implemented'
          )
        }
      })
    )
  })

  it('property: error propagation from org service', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          new NoSelectedOrgError(),
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
