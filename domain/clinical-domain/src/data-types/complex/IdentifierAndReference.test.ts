import { expect, test, describe } from 'vitest'
import {
  IdentifierFromFhirR4,
  ReferenceFromFhirR4,
} from './IdentifierAndReference'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type {
  Reference as FhirReference,
  Identifier as FhirIdentifier,
} from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _referenceEncoded: DeepReadonly<FhirReference> =
  ReferenceFromFhirR4.Encoded
const _identifierEncoded: DeepReadonly<FhirIdentifier> =
  IdentifierFromFhirR4.Encoded

const referenceArb = Arbitrary.make(ReferenceFromFhirR4)

describe('Reference model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(referenceArb, (reference) => {
        const encoded = Schema.encodeSync(ReferenceFromFhirR4)(reference)
        const decoded = Schema.decodeSync(ReferenceFromFhirR4)(encoded)
        expect(decoded).toEqual(reference)
      })
    )
  })
})

const identifierArb = Arbitrary.make(IdentifierFromFhirR4)

describe('Identifier model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(identifierArb, (identifier) => {
        const encoded = Schema.encodeSync(IdentifierFromFhirR4)(identifier)
        const decoded = Schema.decodeSync(IdentifierFromFhirR4)(encoded)
        expect(decoded).toEqual(identifier)
      })
    )
  })
})
