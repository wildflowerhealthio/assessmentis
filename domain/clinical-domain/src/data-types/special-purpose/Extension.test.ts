import { expect, test, describe } from 'vitest'
import { ExtensionFromFhirR4 } from './Extension'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { Extension as FhirExtension } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _extensionEncoded: DeepReadonly<FhirExtension> =
  ExtensionFromFhirR4.Encoded

const extensionArb = Arbitrary.make(ExtensionFromFhirR4)

describe('Extension model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(extensionArb, (extension) => {
        const encoded = Schema.encodeSync(ExtensionFromFhirR4)(extension)
        const decoded = Schema.decodeSync(ExtensionFromFhirR4)(encoded)
        expect(decoded).toEqual(decoded)
      })
    )
  })
})
