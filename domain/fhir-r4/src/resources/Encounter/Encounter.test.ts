import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import * as fc from 'fast-check'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { Encounter } from '@assessmentis/clinical-domain'
import { BaseUrl } from '../../data-types/UrlIdentification'
import { FhirR4Encounter } from './Encounter'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Encounter', () => {
  test('property: FHIR encode-decode round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        Arbitrary.make(Encounter).map((v) => deepAssignBaseUrls(v, baseUrl)),
        async (encounter) => {
          const decoded = await Effect.runPromise(
            Effect.gen(function* () {
              const fhir: FhirR4.Encounter =
                yield* Schema.encode(FhirR4Encounter)(encounter)
              return yield* Schema.decode(FhirR4Encounter)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(encounter)
        }
      )
    )
  })
})
