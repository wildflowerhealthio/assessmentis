import type { DeepReadonly } from '@assessmentis/util'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { Quantity as FhirQuantity } from 'fhir/r4'
import { describe, expect, test } from 'vitest'
import { SimpleQuantity } from './simple-quantity'

// Compile-time check that Encoded schema matches FHIR R4
const _simpleQuantityEncoded: DeepReadonly<FhirQuantity> = SimpleQuantity.Encoded

const quantityArb = Arbitrary.make(SimpleQuantity)

describe('SimpleQuantity model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(quantityArb, (quantity) => {
        const encoded = Schema.encodeSync(SimpleQuantity)(quantity)
        const decoded = Schema.decodeSync(SimpleQuantity)(encoded)
        expect(decoded).toSchemaEqual(quantity)
      })
    )
  })
})
