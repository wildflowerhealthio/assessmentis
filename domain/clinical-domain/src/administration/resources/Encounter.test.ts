import { expect, test, describe } from 'vitest'
import { EncounterFromFhirR4 } from './Encounter'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { Encounter as FhirEncounter } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _encounterEncoded: DeepReadonly<FhirEncounter> =
  EncounterFromFhirR4.Encoded

const encounterArb = Arbitrary.make(EncounterFromFhirR4)

describe('Encounter resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(encounterArb, (encounter) => {
        const encoded = Schema.encodeSync(EncounterFromFhirR4)(encounter)
        const decoded = Schema.decodeSync(EncounterFromFhirR4)(encoded)
        expect(decoded).toEqual(encounter)
      })
    )
  })
})
