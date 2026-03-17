import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'

import { Observation } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { BaseUrl } from '../../data-types/UrlIdentification'
import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { FhirR4Observation } from './Observation'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Observation', () => {
  test('property: FHIR encode-decode round-trip', () => {
    fc.assert(
      fc.property(
        Arbitrary.make(Observation).map((v) => deepAssignBaseUrls(v, baseUrl)),
        (observation) => {
          const decoded = Effect.runSync(
            Effect.gen(function* () {
              const fhir: FhirR4.Observation =
                yield* Schema.encode(FhirR4Observation)(observation)
              return yield* Schema.decode(FhirR4Observation)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(observation)
        }
      )
    )
  })
})
