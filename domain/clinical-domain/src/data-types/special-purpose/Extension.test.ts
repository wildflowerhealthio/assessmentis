import { expect, test, describe } from 'vitest'
import { Extension } from './Extension'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { Extension as FhirExtension } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _extensionEncoded: DeepReadonly<FhirExtension> = Extension.Encoded

const extensionArb = Arbitrary.make(Extension)

describe('Extension model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(extensionArb, (extension) => {
        const encoded = Schema.encodeSync(Extension)(extension)
        const decoded = Schema.decodeSync(Extension)(encoded)
        expect(decoded).toEqual(extension)
      })
    )
  })
})
