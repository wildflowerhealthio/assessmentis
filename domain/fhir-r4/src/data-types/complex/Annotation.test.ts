import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import * as fc from 'fast-check'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { Annotation } from '@assessmentis/clinical-domain/data-types'
import { BaseUrl } from '../UrlIdentification'
import { FhirR4Annotation } from './Annotation'
import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Annotation', () => {
  test('property: FHIR encode-decode round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(Arbitrary.make(Annotation).map((v) => deepAssignBaseUrls(v, baseUrl)), async (annotation) => {
        const decoded = await Effect.runPromise(
          Effect.gen(function* () {
            const fhir: FhirR4.Annotation =
              yield* Schema.encode(FhirR4Annotation)(annotation)
            return yield* Schema.decode(FhirR4Annotation)(fhir)
          }).pipe(Effect.provide(TestBaseUrl))
        )
        expect(decoded).toEqual(annotation)
      })
    )
  })
})
