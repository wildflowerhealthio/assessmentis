import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'

import { Composition } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { BaseUrl } from '../../data-types/UrlIdentification'
import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { FhirR4Composition } from './Composition'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Composition', () => {
  test('property: FHIR encode-decode round-trip', () => {
    fc.assert(
      fc.property(
        Arbitrary.make(Composition).map((v) => deepAssignBaseUrls(v, baseUrl)),
        (composition) => {
          const decoded = Effect.runSync(
            Effect.gen(function* () {
              const fhir: FhirR4.Composition =
                yield* Schema.encode(FhirR4Composition)(composition)
              return yield* Schema.decode(FhirR4Composition)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(composition)
        }
      )
    )
  })
})
