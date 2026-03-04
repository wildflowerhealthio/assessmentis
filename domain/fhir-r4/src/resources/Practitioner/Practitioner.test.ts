import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import * as fc from 'fast-check'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { Practitioner } from '@assessmentis/clinical-domain'
import { BaseUrl } from '../../data-types/UrlIdentification'
import { FhirR4Practitioner } from './Practitioner'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Practitioner', () => {
  test('property: FHIR encode-decode round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        Arbitrary.make(Practitioner).map((v) => deepAssignBaseUrls(v, baseUrl)),
        async (practitioner) => {
          const decoded = await Effect.runPromise(
            Effect.gen(function* () {
              const fhir: FhirR4.Practitioner =
                yield* Schema.encode(FhirR4Practitioner)(practitioner)
              return yield* Schema.decode(FhirR4Practitioner)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(practitioner)
        }
      )
    )
  })
})
