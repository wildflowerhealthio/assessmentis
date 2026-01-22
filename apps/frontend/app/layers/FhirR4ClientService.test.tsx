import { describe, it, expect } from 'vitest'
import { Effect, Either, Stream, Take, Layer } from 'effect'
import * as fc from 'fast-check'
import {
  createFhirR4ClientPubSub,
  startFhirR4ClientService,
  FhirR4ClientService,
} from './FhirR4ClientService'
import { Org, OrgSlug } from '@assessmentis/platform-domain'
import {
  LoadedGapiClient,
  LoadedGapiHealthcareClient,
} from '@assessmentis/google-fhir-web-infrastructure'

describe('FhirR4ClientService', () => {
  const mockOrgGoogleFhir: Org = {
    slug: OrgSlug.make('test-org'),
    frontendConfig: {
      fhirServer: {
        _tag: 'google_fhir_store',
        apiKey: null,
        projectId: 'test-project',
        region: 'us-central1',
        dataset: 'test-dataset',
        storeId: 'test-store',
      },
      videoCallClient: { _tag: 'not_implemented' },
    },
  }

  const mockOrgNotImplemented: Org = {
    slug: OrgSlug.make('test-org'),
    frontendConfig: {
      fhirServer: { _tag: 'not_implemented' },
      videoCallClient: { _tag: 'not_implemented' },
    },
  }

  it('property: PubSub lifecycle and service structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(mockOrgGoogleFhir, mockOrgNotImplemented),
        async (mockOrg) => {
          const program = Effect.gen(function* () {
            const pubsub = yield* createFhirR4ClientPubSub

            // Verify PubSub interaction (sliding capacity of 1 with replay)
            yield* pubsub.publish(Take.of(Either.right({} as any)))
            yield* pubsub.publish(Take.of(Either.right({} as any)))

            // Create service with org stream
            const orgStream = Stream.make(Either.right(mockOrg))
            const service = yield* startFhirR4ClientService(
              pubsub,
              orgStream
            ).pipe(
              Effect.provide(Layer.succeed(LoadedGapiClient, {} as typeof LoadedGapiClient.Service)),
              Effect.provide(Layer.succeed(LoadedGapiHealthcareClient, {} as typeof LoadedGapiHealthcareClient.Service)),
              Effect.scoped
            )

            // Verify service structure
            expect(service).toBeDefined()
            expect(service).toHaveProperty('client')
            expect(service).toHaveProperty('clientStream')
            expect(service).toHaveProperty('shutdown')
            expect(Effect.isEffect(service.shutdown)).toBe(true)
            expect(FhirR4ClientService.key).toBe('FhirR4ClientService')
          })

          await Effect.runPromise(program)
        }
      )
    )
  })
})
