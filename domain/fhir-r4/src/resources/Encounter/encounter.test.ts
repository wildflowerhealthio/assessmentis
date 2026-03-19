import { Arbitrary, Effect, Layer, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { Encounter } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { BaseUrl } from '../../data-types/url-identification'
import { deepAssignBaseUrls } from '../../deep-assign-base-urls'
import { FhirR4Encounter } from './encounter'

const baseUrl = ReadonlyUrl.make({
  host: 'example.com',
  pathname: '/fhir',
  protocol: 'http:',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Encounter', () => {
  test('property: FHIR encode-decode round-trip', () => {
    fc.assert(
      fc.property(
        Arbitrary.make(Encounter).map((v) => deepAssignBaseUrls(v, baseUrl)),
        (encounter) => {
          const decoded = Effect.runSync(
            Effect.gen(function* decoded() {
              const fhir: FhirR4.Encounter = yield* Schema.encode(FhirR4Encounter)(encounter)
              return yield* Schema.decode(FhirR4Encounter)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toSchemaEqual(encounter)
        }
      )
    )
  })
})
