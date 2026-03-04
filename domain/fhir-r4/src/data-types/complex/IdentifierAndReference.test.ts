import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import * as fc from 'fast-check'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { Reference, Identifier } from '@assessmentis/clinical-domain/data-types'
import { BaseUrl } from '../UrlIdentification'
import { FhirR4Reference, FhirR4Identifier } from './IdentifierAndReference'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Reference', () => {
  test('property: FHIR encode-decode round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        Arbitrary.make(Reference).map((v) => deepAssignBaseUrls(v, baseUrl)),
        async (reference) => {
          const decoded = await Effect.runPromise(
            Effect.gen(function* () {
              const fhir: FhirR4.Reference =
                yield* Schema.encode(FhirR4Reference)(reference)
              return yield* Schema.decode(FhirR4Reference)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(reference)
        }
      )
    )
  })
})

describe('FhirR4Identifier', () => {
  test('property: FHIR encode-decode round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        Arbitrary.make(Identifier).map((v) => deepAssignBaseUrls(v, baseUrl)),
        async (identifier) => {
          const decoded = await Effect.runPromise(
            Effect.gen(function* () {
              const fhir: FhirR4.Identifier =
                yield* Schema.encode(FhirR4Identifier)(identifier)
              return yield* Schema.decode(FhirR4Identifier)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(identifier)
        }
      )
    )
  })
})
