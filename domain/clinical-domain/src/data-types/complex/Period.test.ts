import { expect, test, describe } from 'vitest'
import type { Period } from './Period'
import { PeriodFromFhirR4 } from './Period'
import { Arbitrary, DateTime, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { Period as FhirPeriod } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _periodEncoded: DeepReadonly<FhirPeriod> = PeriodFromFhirR4.Encoded

const periodArb = Arbitrary.make(PeriodFromFhirR4)

describe('Period model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(periodArb, (period) => {
        const encoded = Schema.encodeSync(PeriodFromFhirR4)(period)
        const decoded = Schema.decodeSync(PeriodFromFhirR4)(encoded)
        expect(decoded).toEqual(period)
      })
    )
  })

  test('should handle google style input', () => {
    const decode = Schema.decodeSync(PeriodFromFhirR4)

    const decoded = decode({
      id: '123',
      start: '2026-01-04T00:00:00.000Z',
      end: '2026-01-07T00:00:00.000Z',
    })

    expect(decoded.start).toEqual(
      DateTime.unsafeMake('2026-01-04T00:00:00.000Z')
    )
    expect(decoded.end).toEqual(DateTime.unsafeMake('2026-01-07T00:00:00.000Z'))
  })
})
