import { expect, test, describe } from 'vitest'
import { HumanName } from './HumanName'
import type { DeepReadonly } from '@assessmentis/util'
import type { HumanName as FhirHumanName } from 'fhir/r4'
import { Schema, Arbitrary } from 'effect'
import * as fc from 'fast-check'

// Compile-time check that Encoded schema matches FHIR R4
const _humanNameEncoded: DeepReadonly<FhirHumanName> = HumanName.Encoded

const humanNameArb = Arbitrary.make(HumanName)

describe('HumanName model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(humanNameArb, (humanName) => {
        const encoded = Schema.encodeSync(HumanName)(humanName)
        const decoded = Schema.decodeSync(HumanName)(encoded)
        expect(decoded).toEqual(humanName)
      })
    )
  })
})
