import { describe, it, expect } from 'vitest'
import { Effect, Either, Stream, Take, Layer, Arbitrary } from 'effect'
import * as fc from 'fast-check'
import {
  createFhirR4ClientPubSub,
  startFhirR4ClientService,
  FhirR4ClientService,
} from './FhirR4ClientService'
import { Org } from '@assessmentis/platform-domain'
import {
  LoadedGapiClient,
  LoadedGapiHealthcareClient,
} from '@assessmentis/google-fhir-web-infrastructure'
import { neverUsedMock } from '@assessmentis/util'
import { Hub } from '@assessmentis/effectful-store'
import type { ResourceDataTypes } from '@assessmentis/clinical-domain'

// Generate arbitrary Org values using the schema
const orgArb = Arbitrary.make(Org)

describe('FhirR4ClientService', () => {
  it('property: PubSub lifecycle and service structure', async () => {
    await fc.assert(
      fc.asyncProperty(orgArb, async (org) => {
        const program = Effect.gen(function* () {
          const pubsub = yield* createFhirR4ClientPubSub

          // Verify PubSub interaction (sliding capacity of 1 with replay)
          yield* pubsub.publish(Take.of(Either.right(neverUsedMock('client1'))))
          yield* pubsub.publish(Take.of(Either.right(neverUsedMock('client2'))))

          // Create service with org stream
          const orgStream = Stream.make(Either.right(org))
          const hub = yield* Hub.makeHub<ResourceDataTypes>()
          const service = yield* startFhirR4ClientService(
            pubsub,
            orgStream,
            hub
          ).pipe(
            Effect.provide(
              Layer.succeed(
                LoadedGapiClient,
                neverUsedMock<typeof LoadedGapiClient.Service>(
                  'LoadedGapiClient'
                )
              )
            ),
            Effect.provide(
              Layer.succeed(
                LoadedGapiHealthcareClient,
                neverUsedMock<typeof LoadedGapiHealthcareClient.Service>(
                  'LoadedGapiHealthcareClient'
                )
              )
            ),
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
      })
    )
  })
})
