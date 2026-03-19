import { Arbitrary, Effect, Layer, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { Address } from '@assessmentis/clinical-domain/data-types'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { deepAssignBaseUrls } from '../../deep-assign-base-urls'
import { BaseUrl } from '../url-identification'
import { FhirR4Address } from './address'

const baseUrl = ReadonlyUrl.make({
  host: 'example.com',
  pathname: '/fhir',
  protocol: 'http:',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Address', () => {
  test('property: FHIR encode-decode round-trip', () => {
    fc.assert(
      fc.property(
        Arbitrary.make(Address).map((v) => deepAssignBaseUrls(v, baseUrl)),
        (address) => {
          const decoded = Effect.runSync(
            Effect.gen(function* decoded() {
              const fhir: FhirR4.Address = yield* Schema.encode(FhirR4Address)(address)
              return yield* Schema.decode(FhirR4Address)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toSchemaEqual(address)
        }
      )
    )
  })
})
