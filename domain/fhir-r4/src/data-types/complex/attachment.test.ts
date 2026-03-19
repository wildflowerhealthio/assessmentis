import { Arbitrary, Effect, Layer, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { Attachment } from '@assessmentis/clinical-domain/data-types'
import { ReadonlyUrl } from '@assessmentis/effectful-store'

import type FhirR4 from 'fhir/r4'

import { deepAssignBaseUrls } from '../../deep-assign-base-urls'
import { BaseUrl } from '../url-identification'
import { FhirR4Attachment } from './attachment'

const baseUrl = ReadonlyUrl.make({
  host: 'example.com',
  pathname: '/fhir',
  protocol: 'http:',
})

const TestBaseUrl = Layer.succeed(BaseUrl, baseUrl)

describe('FhirR4Attachment', () => {
  test('property: FHIR encode-decode round-trip', () => {
    fc.assert(
      fc.property(
        Arbitrary.make(Attachment).map((v) => deepAssignBaseUrls(v, baseUrl)),
        (attachment) => {
          const decoded = Effect.runSync(
            Effect.gen(function* decoded() {
              const fhir: FhirR4.Attachment = yield* Schema.encode(FhirR4Attachment)(attachment)
              return yield* Schema.decode(FhirR4Attachment)(fhir)
            }).pipe(Effect.provide(TestBaseUrl))
          )
          expect(decoded).toSchemaEqual(attachment)
        }
      )
    )
  })
})
