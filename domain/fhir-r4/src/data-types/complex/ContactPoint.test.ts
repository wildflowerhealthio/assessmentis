import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'

import { ContactPoint } from '@assessmentis/clinical-domain/data-types'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { BaseUrl } from '../UrlIdentification'
import { FhirR4ContactPoint } from './ContactPoint'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4ContactPoint', () => {
  test('property: FHIR encode-decode round-trip', () => {
    fc.assert(
      fc.property(
        Arbitrary.make(ContactPoint).map((v) => deepAssignBaseUrls(v, baseUrl)),
        (contactPoint) => {
          const decoded = Effect.runSync(
            Effect.gen(function* () {
              const fhir: FhirR4.ContactPoint =
                yield* Schema.encode(FhirR4ContactPoint)(contactPoint)
              return yield* Schema.decode(FhirR4ContactPoint)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(contactPoint)
        }
      )
    )
  })
})
