import { expect, test, describe } from 'vitest'
import { DiagnosticReport } from './DiagnosticReport'
import { Arbitrary, Either, Schema } from 'effect'
import * as fc from 'fast-check'

const reportArb = Arbitrary.make(DiagnosticReport.Schema)

describe('DiagnosticReport model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(reportArb, (report) => {
        const encoded = Schema.encodeSync(DiagnosticReport.Schema)(report)
        const decoded = Schema.decodeSync(DiagnosticReport.Schema)(encoded)
        expect(decoded).toEqual(report)
      })
    )
  })

  test('property: missing required fields always fail', () => {
    // Property: DiagnosticReport must have resourceType, status, and code
    fc.assert(
      fc.property(
        fc.oneof(
          // Missing status
          fc.record({
            resourceType: fc.constant('DiagnosticReport' as const),
            code: fc.record({ text: fc.string() }),
          }),
          // Missing code
          fc.record({
            resourceType: fc.constant('DiagnosticReport' as const),
            status: fc.constantFrom('final', 'preliminary'),
          }),
          // Missing resourceType
          fc.record({
            status: fc.constantFrom('final', 'preliminary'),
            code: fc.record({ text: fc.string() }),
          })
        ),
        (incomplete) => {
          const decode = Schema.decodeUnknownEither(DiagnosticReport.Schema)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})
