import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'

import { DiagnosticReport } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { BaseUrl } from '../../data-types/UrlIdentification'
import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { FhirR4DiagnosticReport } from './DiagnosticReport'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4DiagnosticReport', () => {
  test('property: FHIR encode-decode round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        Arbitrary.make(DiagnosticReport).map((v) =>
          deepAssignBaseUrls(v, baseUrl)
        ),
        async (diagnosticReport) => {
          const decoded = await Effect.runPromise(
            Effect.gen(function* () {
              const fhir: FhirR4.DiagnosticReport = yield* Schema.encode(
                FhirR4DiagnosticReport
              )(diagnosticReport)
              return yield* Schema.decode(FhirR4DiagnosticReport)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(diagnosticReport)
        }
      )
    )
  })
})
