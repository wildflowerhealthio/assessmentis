import { Arbitrary, Either, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { DiagnosticReport } from './diagnostic-report'

const reportArb = Arbitrary.make(DiagnosticReport)

describe('DiagnosticReport model', () => {
  test('DiagnosticReport.DomainType is "DiagnosticReport"', () => {
    expect(DiagnosticReport.DomainType).toBe('DiagnosticReport')
  })

  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(reportArb, (report) => {
        const encoded = Schema.encodeSync(DiagnosticReport)(report)
        const decoded = Schema.decodeSync(DiagnosticReport)(encoded)
        expect(decoded).toSchemaEqual(report)
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
            code: fc.record({ text: fc.string() }),
            domainType: fc.constant('DiagnosticReport' as const),
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
