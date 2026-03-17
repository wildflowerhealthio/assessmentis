import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'

import { Practitioner } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { BaseUrl } from '../../data-types/UrlIdentification'
import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { FhirR4Practitioner } from './Practitioner'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Practitioner', () => {
  test('property: FHIR encode-decode round-trip', () => {
    fc.assert(
      fc.property(
        Arbitrary.make(Practitioner).map((v) => deepAssignBaseUrls(v, baseUrl)),
        (practitioner) => {
          const decoded = Effect.runSync(
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
