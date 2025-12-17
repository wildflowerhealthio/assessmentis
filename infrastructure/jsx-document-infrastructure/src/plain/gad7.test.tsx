import * as fc from 'fast-check'
import React from 'react'
import { describe, expect, it } from 'vitest'

import type { Gad7ReportProps } from '@assessmentis/document-domain'

import PlainGad7Report from './gad7'

const gad7PropsArb: fc.Arbitrary<Gad7ReportProps> = fc
  .array(fc.string({ maxLength: 12 }), { minLength: 1, maxLength: 5 })
  .chain((headers) =>
    fc.record({
      table: fc.record({
        dataHeaders: fc.constant(headers),
        rows: fc.array(
          fc.record({
            question: fc.option(fc.string({ maxLength: 60 }), {
              nil: undefined,
            }),
            data: fc.array(fc.string({ maxLength: 12 }), {
              minLength: headers.length,
              maxLength: headers.length,
            }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        totalScore: fc.integer({ min: 0, max: 100 }),
      }),
    })
  ) as fc.Arbitrary<Gad7ReportProps>

describe('PlainGad7Report', () => {
  it('renders a valid element for generated scoring tables', () => {
    fc.assert(
      fc.property(gad7PropsArb, (props) => {
        const element = PlainGad7Report(props)
        expect(React.isValidElement(element)).toBe(true)
      })
    )
  })
})
