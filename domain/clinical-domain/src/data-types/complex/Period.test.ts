import { expect, test, describe, expectTypeOf } from 'vitest'
import { Period, type PeriodEncoded } from './Period'
import { Arbitrary, DateTime, Schema } from 'effect'
import * as fc from 'fast-check'

const periodArb = Arbitrary.make(Period)

describe('Period model', () => {
  test('types', () => {
    expectTypeOf(Period.Encoded).toExtend<PeriodEncoded>()
  })

  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(periodArb, (period) => {
        const encoded = Schema.encodeSync(Period)(period)
        const decoded = Schema.decodeSync(Period)(encoded)
        expect(decoded).toEqual(period)
      })
    )
  })

  test('should handle google style input', () => {
    const decode = Schema.decodeSync(Period)

    const decoded = decode({
      url: 'http://example.com/Period/id',
      start: '2026-01-04T00:00:00.000Z',
      end: '2026-01-07T00:00:00.000Z',
    })

    expect(decoded.start).toEqual(
      DateTime.unsafeMake('2026-01-04T00:00:00.000Z')
    )
    expect(decoded.end).toEqual(DateTime.unsafeMake('2026-01-07T00:00:00.000Z'))
  })
})
