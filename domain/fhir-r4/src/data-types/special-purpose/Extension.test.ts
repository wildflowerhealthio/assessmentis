import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import * as fc from 'fast-check'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { Extension } from '@assessmentis/clinical-domain/data-types'
import { BaseUrl } from '../UrlIdentification'
import { FhirR4Extension } from './Extension'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Extension', () => {
  test('property: FHIR encode-decode round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        Arbitrary.make(Extension).map((ext) =>
          deepAssignBaseUrls(Extension.make({ ...ext, extension: [] }), baseUrl)
        ),
        async (extension) => {
          const decoded = await Effect.runPromise(
            Effect.gen(function* () {
              const fhir: FhirR4.Extension =
                yield* Schema.encode(FhirR4Extension)(extension)
              return yield* Schema.decode(FhirR4Extension)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(extension)
        }
      )
    )
  })
})
