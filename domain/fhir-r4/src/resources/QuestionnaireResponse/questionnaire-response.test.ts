import { Arbitrary, Effect, Layer, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { QuestionnaireResponse } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { BaseUrl } from '../../data-types/url-identification'
import { deepAssignBaseUrls } from '../../deep-assign-base-urls'
import { FhirR4QuestionnaireResponse } from './questionnaire-response'

const baseUrl = ReadonlyUrl.make({
  host: 'example.com',
  pathname: '/fhir',
  protocol: 'http:',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4QuestionnaireResponse', () => {
  test('property: FHIR encode-decode round-trip', () => {
    fc.assert(
      fc.property(
        Arbitrary.make(QuestionnaireResponse).map((v) => deepAssignBaseUrls(v, baseUrl)),
        (questionnaireResponse) => {
          const decoded = Effect.runSync(
            Effect.gen(function* decoded() {
              const fhir: FhirR4.QuestionnaireResponse = yield* Schema.encode(
                FhirR4QuestionnaireResponse
              )(questionnaireResponse)
              return yield* Schema.decode(FhirR4QuestionnaireResponse)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toSchemaEqual(questionnaireResponse)
        }
      )
    )
  })
})
