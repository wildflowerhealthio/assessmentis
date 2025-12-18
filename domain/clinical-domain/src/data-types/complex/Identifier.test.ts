import { expect, test, describe } from 'vitest'
import { Identifier } from './Identifier'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { Identifier as FhirIdentifier } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _identifierEncoded: DeepReadonly<FhirIdentifier> = Identifier.Encoded

const identifierArb = Arbitrary.make(Identifier)

describe('Identifier model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(identifierArb, (identifier) => {
        const encoded = Schema.encodeSync(Identifier)(identifier)
        const decoded = Schema.decodeSync(Identifier)(encoded)
        expect(decoded).toEqual(identifier)
      })
    )
  })
})
