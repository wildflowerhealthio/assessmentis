import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'

import { HumanName } from '@assessmentis/clinical-domain/data-types'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { BaseUrl } from '../UrlIdentification'
import { FhirR4HumanName } from './HumanName'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4HumanName', () => {
  test('property: FHIR encode-decode round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        Arbitrary.make(HumanName).map((v) => deepAssignBaseUrls(v, baseUrl)),
        async (humanName) => {
          const decoded = await Effect.runPromise(
            Effect.gen(function* () {
              const fhir: FhirR4.HumanName =
                yield* Schema.encode(FhirR4HumanName)(humanName)
              return yield* Schema.decode(FhirR4HumanName)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(humanName)
        }
      )
    )
  })
})
