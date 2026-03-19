import { Arbitrary, Effect, Layer, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { Questionnaire } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { BaseUrl } from '../../data-types/url-identification'
import { deepAssignBaseUrls } from '../../deep-assign-base-urls'
import { FhirR4Questionnaire } from './questionnaire'

const baseUrl = ReadonlyUrl.make({
  host: 'example.com',
  pathname: '/fhir',
  protocol: 'http:',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Questionnaire', () => {
  test('property: FHIR encode-decode round-trip', () => {
    fc.assert(
      fc.property(
        Arbitrary.make(Questionnaire).map((v) => deepAssignBaseUrls(v, baseUrl)),
        (questionnaire) => {
          const decoded = Effect.runSync(
            Effect.gen(function* decoded() {
              const fhir: FhirR4.Questionnaire =
                yield* Schema.encode(FhirR4Questionnaire)(questionnaire)
              return yield* Schema.decode(FhirR4Questionnaire)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toSchemaEqual(questionnaire)
        }
      )
    )
  })
})
