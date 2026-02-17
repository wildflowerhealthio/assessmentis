import { expect, test, describe } from 'vitest'
import { Period } from './Period'
import { Arbitrary, DateTime, Schema } from 'effect'
import * as fc from 'fast-check'

const periodArb = Arbitrary.make(Period.Schema)

describe('Period model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(periodArb, (period) => {
        const encoded = Schema.encodeSync(Period.Schema)(period)
        const decoded = Schema.decodeSync(Period.Schema)(encoded)
        expect(decoded).toEqual(period)
      })
    )
  })

  test('should handle google style input', () => {
    const decode = Schema.decodeSync(Period.Schema)

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
