import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import * as fc from 'fast-check'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { ContactPoint } from '@assessmentis/clinical-domain/data-types'
import { BaseUrl } from '../UrlIdentification'
import { FhirR4ContactPoint } from './ContactPoint'
import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4ContactPoint', () => {
  test('property: FHIR encode-decode round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(Arbitrary.make(ContactPoint).map((v) => deepAssignBaseUrls(v, baseUrl)), async (contactPoint) => {
        const decoded = await Effect.runPromise(
          Effect.gen(function* () {
            const fhir: FhirR4.ContactPoint =
              yield* Schema.encode(FhirR4ContactPoint)(contactPoint)
            return yield* Schema.decode(FhirR4ContactPoint)(fhir)
          }).pipe(Effect.provide(TestBaseUrl))
        )
        expect(decoded).toEqual(contactPoint)
      })
    )
  })
})
