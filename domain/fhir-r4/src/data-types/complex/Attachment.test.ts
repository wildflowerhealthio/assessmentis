import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Effect, Layer, Schema } from 'effect'

import { Attachment } from '@assessmentis/clinical-domain/data-types'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { deepAssignBaseUrls } from '../../deepAssignBaseUrls'
import { BaseUrl } from '../UrlIdentification'
import { FhirR4Attachment } from './Attachment'

const baseUrl = ReadonlyUrl.make({
  protocol: 'http:',
  host: 'example.com',
  pathname: '/fhir',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Attachment', () => {
  test('property: FHIR encode-decode round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        Arbitrary.make(Attachment).map((v) => deepAssignBaseUrls(v, baseUrl)),
        async (attachment) => {
          const decoded = await Effect.runPromise(
            Effect.gen(function* () {
              const fhir: FhirR4.Attachment =
                yield* Schema.encode(FhirR4Attachment)(attachment)
              return yield* Schema.decode(FhirR4Attachment)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toEqual(attachment)
        }
      )
    )
  })
})
