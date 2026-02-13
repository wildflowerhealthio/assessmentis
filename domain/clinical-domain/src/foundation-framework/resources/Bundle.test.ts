import { expect, test, describe } from 'vitest'
import { BundleFromFhirR4 } from './Bundle'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { Bundle as FhirBundle } from 'fhir/r4'

// Create a concrete Bundle type for testing
const TestBundle = BundleFromFhirR4(Schema.String)

// Compile-time check that Encoded schema matches FHIR R4
// Note: We cast to unknown first because our Bundle is generic and strict FHIR types might mismatch on specific generics
const _bundleEncoded: DeepReadonly<FhirBundle> =
  TestBundle.Encoded as unknown as DeepReadonly<FhirBundle>

const bundleArb = Arbitrary.make(TestBundle)

describe('Bundle resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(bundleArb, (bundle) => {
        const encoded = Schema.encodeSync(TestBundle)(bundle)
        const decoded = Schema.decodeSync(TestBundle)(encoded)
        expect(decoded).toEqual(bundle)
      })
    )
  })
})
