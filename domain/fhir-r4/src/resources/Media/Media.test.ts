import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'

import { Media } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { BaseUrl } from '../../data-types/UrlIdentification'
import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { FhirR4Media } from './Media'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Media', () => {
  test('property: FHIR encode-decode round-trip', () => {
    fc.assert(
      fc.property(
        Arbitrary.make(Media).map((v) => deepAssignBaseUrls(v, baseUrl)),
        (media) => {
          const decoded = Effect.runSync(
            Effect.gen(function* () {
              const fhir: FhirR4.Media =
                yield* Schema.encode(FhirR4Media)(media)
              return yield* Schema.decode(FhirR4Media)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(media)
        }
      )
    )
  })
})
