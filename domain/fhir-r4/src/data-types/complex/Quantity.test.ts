import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import * as fc from 'fast-check'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { Quantity } from '@assessmentis/clinical-domain/data-types'
import { BaseUrl } from '../UrlIdentification'
import { FhirR4Quantity } from './Quantity'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Quantity', () => {
  test('property: FHIR encode-decode round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        Arbitrary.make(Quantity).map((v) => deepAssignBaseUrls(v, baseUrl)),
        async (quantity) => {
          const decoded = await Effect.runPromise(
            Effect.gen(function* () {
              const fhir: FhirR4.Quantity =
                yield* Schema.encode(FhirR4Quantity)(quantity)
              return yield* Schema.decode(FhirR4Quantity)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(quantity)
        }
      )
    )
  })
})
