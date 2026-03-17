import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'

import { Annotation } from '@assessmentis/clinical-domain/data-types'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { BaseUrl } from '../UrlIdentification'
import { FhirR4Annotation } from './Annotation'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Annotation', () => {
  test('property: FHIR encode-decode round-trip', () => {
    fc.assert(
      fc.property(
        Arbitrary.make(Annotation).map((v) => deepAssignBaseUrls(v, baseUrl)),
        (annotation) => {
          const decoded = Effect.runSync(
            Effect.gen(function* () {
              const fhir: FhirR4.Annotation =
                yield* Schema.encode(FhirR4Annotation)(annotation)
              return yield* Schema.decode(FhirR4Annotation)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(annotation)
        }
      )
    )
  })
})
