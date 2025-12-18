import { expect, test, describe } from 'vitest'
import { Encounter } from './Encounter'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { Encounter as FhirEncounter } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _encounterEncoded: DeepReadonly<FhirEncounter> = Encounter.Encoded

const encounterArb = Arbitrary.make(Encounter)

describe('Encounter resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(encounterArb, (encounter) => {
        const encoded = Schema.encodeSync(Encounter)(encounter)
        const decoded = Schema.decodeSync(Encounter)(encoded)
        expect(decoded).toEqual(encounter)
      })
    )
  })
})
