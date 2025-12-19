import { describe, expect, test } from 'vitest'
import * as fc from 'fast-check'
import { Arbitrary, Schema } from 'effect'
import {
  ScoringProps,
  TableBodyProps,
  TableRowProps,
  TitleProps,
} from './componentProps'

const tableRowArb = Arbitrary.make(TableRowProps)

const scoringArb = Arbitrary.make(ScoringProps)

const titleArb = Arbitrary.make(TitleProps)

const tableBodySchema = TableBodyProps(Schema.String)

const tableBodyArb = Arbitrary.make(TableBodyProps(Schema.String))

describe('component props schemas', () => {
  test('property: TitleProps encode/decode round-trips', () => {
    fc.assert(
      fc.property(titleArb, (title) => {
        const encoded = Schema.encodeSync(TitleProps)(title)
        const decoded = Schema.decodeSync(TitleProps)(encoded)
        expect(decoded).toEqual(title)
      })
    )
  })

  test('property: TableRowProps encode/decode round-trips', () => {
    fc.assert(
      fc.property(tableRowArb, (row) => {
        const encoded = Schema.encodeSync(TableRowProps)(row)
        const decoded = Schema.decodeSync(TableRowProps)(encoded)
        expect(decoded).toEqual(row)
      })
    )
  })

  test('property: ScoringProps encode/decode round-trips', () => {
    fc.assert(
      fc.property(scoringArb, (scoring) => {
        const encoded = Schema.encodeSync(ScoringProps)(scoring)
        const decoded = Schema.decodeSync(ScoringProps)(encoded)
        expect(decoded).toEqual(scoring)
      })
    )
  })

  test('property: TableBodyProps encode/decode round-trips', () => {
    fc.assert(
      fc.property(tableBodyArb, (body) => {
        const encoded = Schema.encodeSync(tableBodySchema)(body)
        const decoded = Schema.decodeSync(tableBodySchema)(encoded)
        expect(decoded).toEqual(body)
      })
    )
  })
})
