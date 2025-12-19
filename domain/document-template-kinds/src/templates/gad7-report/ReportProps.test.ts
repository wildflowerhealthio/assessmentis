import { describe, expect, test } from 'vitest'
import * as fc from 'fast-check'
import { Arbitrary, Schema } from 'effect'
import { ReportProps } from './ReportProps'

const reportPropsArb = Arbitrary.make(ReportProps)

describe('ReportProps schema', () => {
  test('property: encode/decode round-trips arbitrary data', () => {
    fc.assert(
      fc.property(reportPropsArb, (props) => {
        const encoded = Schema.encodeSync(ReportProps)(props)
        const decoded = Schema.decodeSync(ReportProps)(encoded)
        expect(decoded).toEqual(props)
      })
    )
  })
})
