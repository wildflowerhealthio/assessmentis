import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import * as fc from 'fast-check'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { QuestionnaireResponse } from '@assessmentis/clinical-domain'
import { BaseUrl } from '../../data-types/UrlIdentification'
import { FhirR4QuestionnaireResponse } from './QuestionnaireResponse'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4QuestionnaireResponse', () => {
  test('property: FHIR encode-decode round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        Arbitrary.make(QuestionnaireResponse).map((v) => deepAssignBaseUrls(v, baseUrl)),
        async (questionnaireResponse) => {
          const decoded = await Effect.runPromise(
            Effect.gen(function* () {
              const fhir: FhirR4.QuestionnaireResponse = yield* Schema.encode(
                FhirR4QuestionnaireResponse
              )(questionnaireResponse)
              return yield* Schema.decode(FhirR4QuestionnaireResponse)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(questionnaireResponse)
        }
      )
    )
  })
})
