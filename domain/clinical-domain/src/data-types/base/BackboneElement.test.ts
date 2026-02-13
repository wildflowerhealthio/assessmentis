import { expect, test, describe } from 'vitest'
import { BackboneElementFromFhirR4 } from './BackboneElement'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { BackboneElement as FhirBackboneElement } from 'fhir/r4'

const TestBackboneElement = BackboneElementFromFhirR4(Schema.String)

// Compile-time check that Encoded schema matches FHIR R4
const _backboneElementEncoded: DeepReadonly<FhirBackboneElement> =
  TestBackboneElement.Encoded

const backboneElementArb = Arbitrary.make(TestBackboneElement)

describe('BackboneElement base model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(backboneElementArb, (element) => {
        const encoded = Schema.encodeSync(TestBackboneElement)(element)
        const decoded = Schema.decodeSync(TestBackboneElement)(encoded)
        expect(decoded).toEqual(element)
      })
    )
  })
})
