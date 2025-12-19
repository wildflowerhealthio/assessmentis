import { describe, expect, test } from 'vitest'
import * as fc from 'fast-check'
import { Schema } from 'effect'
import { ReportProps } from './ReportProps'

const tableRowArb = fc.record({
  question: fc.string(),
  cells: fc.tuple(fc.string(), fc.string(), fc.string(), fc.string()),
})

const rowsArb = fc.tuple(
  tableRowArb,
  tableRowArb,
  tableRowArb,
  tableRowArb,
  tableRowArb,
  tableRowArb,
  tableRowArb
)

const scoringArb = fc.record({
  totalScore: fc.integer({ min: 0, max: 21 }),
  subtitle: fc.option(fc.string(), { nil: undefined }),
  explainer: fc.option(fc.string(), { nil: undefined }),
  rangeExplanations: fc.option(fc.array(fc.string()), { nil: undefined }),
})

const titleArb = fc.record({
  title: fc.option(fc.string(), { nil: undefined }),
})

const reportPropsArb = fc.record({
  title: titleArb,
  TableHeader: fc.array(fc.string()),
  rows: rowsArb,
  scoring: scoringArb,
})

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
