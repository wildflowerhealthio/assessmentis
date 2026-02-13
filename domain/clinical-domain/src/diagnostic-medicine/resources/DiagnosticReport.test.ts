import { expect, test, describe } from 'vitest'
import { DiagnosticReportFromFhirR4 } from './DiagnosticReport'
import type { DeepReadonly } from '@assessmentis/util'
import type { DiagnosticReport as FhirDiagnosticReport } from 'fhir/r4'
import { Arbitrary, Either, Schema } from 'effect'
import * as fc from 'fast-check'

// Compile-time check that Encoded schema matches FHIR R4
const _diagReportEncoded: DeepReadonly<FhirDiagnosticReport> =
  DiagnosticReportFromFhirR4.Encoded

const reportArb = Arbitrary.make(DiagnosticReportFromFhirR4)

describe('DiagnosticReport model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(reportArb, (report) => {
        const encoded = Schema.encodeSync(DiagnosticReportFromFhirR4)(report)
        const decoded = Schema.decodeSync(DiagnosticReportFromFhirR4)(encoded)
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
          const decode = Schema.decodeUnknownEither(DiagnosticReportFromFhirR4)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})
