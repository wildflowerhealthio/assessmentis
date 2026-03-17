import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'

import { CodeableConcept } from '@assessmentis/clinical-domain/data-types'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { BaseUrl } from '../UrlIdentification'
import { FhirR4CodeableConcept } from './CodeableConcept'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4CodeableConcept', () => {
  test('property: FHIR encode-decode round-trip', () => {
    fc.assert(
      fc.property(
        Arbitrary.make(CodeableConcept).map((v) =>
          deepAssignBaseUrls(v, baseUrl)
        ),
        (codeableConcept) => {
          const decoded = Effect.runSync(
            Effect.gen(function* () {
              const fhir: FhirR4.CodeableConcept = yield* Schema.encode(
                FhirR4CodeableConcept
              )(codeableConcept)
              return yield* Schema.decode(FhirR4CodeableConcept)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(codeableConcept)
        }
      )
    )
  })
})
