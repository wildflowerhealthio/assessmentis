import { expect, test, describe } from 'vitest'
import { Period } from './Period'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { Period as FhirPeriod } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _periodEncoded: DeepReadonly<FhirPeriod> = Period.Encoded

const periodArb = Arbitrary.make(Period)

describe('Period model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(periodArb, (period) => {
        const encoded = Schema.encodeSync(Period)(period)
        const decoded = Schema.decodeSync(Period)(encoded)
        expect(decoded).toEqual(period)
      })
    )
  })
})
