import { expect, test, describe } from 'vitest'
import { Identifier, Reference } from './IdentifierAndReference'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type {
  Reference as FhirReference,
  Identifier as FhirIdentifier,
} from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _referenceEncoded: DeepReadonly<FhirReference> = Reference.Encoded
const _identifierEncoded: DeepReadonly<FhirIdentifier> = Identifier.Encoded

const referenceArb = Arbitrary.make(Reference)

describe('Reference model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(referenceArb, (reference) => {
        const encoded = Schema.encodeSync(Reference)(reference)
        const decoded = Schema.decodeSync(Reference)(encoded)
        expect(decoded).toEqual(reference)
      })
    )
  })
})

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
