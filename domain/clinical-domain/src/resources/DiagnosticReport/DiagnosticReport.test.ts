import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Either, Schema } from 'effect'

import { DiagnosticReport } from './DiagnosticReport'

const reportArb = Arbitrary.make(DiagnosticReport)

describe('DiagnosticReport model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(reportArb, (report) => {
        const encoded = Schema.encodeSync(DiagnosticReport)(report)
        const decoded = Schema.decodeSync(DiagnosticReport)(encoded)
        expect(decoded).toEqual(report)
      })
    )
  })

  test('property: missing required fields always fail', () => {
    // Property: DiagnosticReport must have status, and code
    fc.assert(
      fc.property(
        fc.oneof(
          // Missing status
          fc.record({
            domainType: fc.constant('DiagnosticReport' as const),
            code: fc.record({ text: fc.string() }),
          }),
          // Missing code
          fc.record({
            domainType: fc.constant('DiagnosticReport' as const),
            status: fc.constantFrom('final', 'preliminary'),
          })
        ),
        (incomplete) => {
          const decode = Schema.decodeUnknownEither(DiagnosticReport)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})
