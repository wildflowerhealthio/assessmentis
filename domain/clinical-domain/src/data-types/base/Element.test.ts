import { expect, test, describe } from 'vitest'
import { ElementFromFhirR4 } from './Element'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { Element as FhirElement } from 'fhir/r4'

const TestElement = ElementFromFhirR4(Schema.String)

// Compile-time check that Encoded schema matches FHIR R4
const _elementEncoded: DeepReadonly<FhirElement> = TestElement.Encoded

const elementArb = Arbitrary.make(TestElement)

describe('Element base model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(elementArb, (element) => {
        const encoded = Schema.encodeSync(TestElement)(element)
        const decoded = Schema.decodeSync(TestElement)(encoded)
        expect(decoded).toEqual(element)
      })
    )
  })
})
