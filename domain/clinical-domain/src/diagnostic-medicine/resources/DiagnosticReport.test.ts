import { expect, test, describe } from 'vitest'
import { DiagnosticReport, DiagnosticReportStatus } from './DiagnosticReport'
import { DeepReadonly } from '@assessmentis/util'
import { DiagnosticReport as FhirDiagnosticReport } from 'fhir/r4'
import { Schema, Either } from 'effect'
import * as fc from 'fast-check'

// Compile-time check that Encoded schema matches FHIR R4
const _diagReportEncoded: DeepReadonly<FhirDiagnosticReport> =
  DiagnosticReport.Encoded

describe('DiagnosticReport model', () => {
  test('property: encode-decode cycle preserves minimal DiagnosticReport', () => {
    // Property: Minimal valid DiagnosticReport should encode-decode correctly
    fc.assert(
      fc.property(
        fc.constantFrom(
          'registered',
          'partial',
          'preliminary',
          'final',
          'amended',
          'corrected',
          'appended',
          'cancelled',
          'entered-in-error',
          'unknown'
        ),
        fc.string(),
        (status, codeText) => {
          const decode = Schema.decodeUnknownEither(DiagnosticReport)
          const encode = Schema.encodeUnknownEither(DiagnosticReport)

          const report = {
            resourceType: 'DiagnosticReport' as const,
            status,
            code: { text: codeText },
          }

          const decoded = decode(report)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            expect(Either.isRight(encoded)).toBe(true)
            if (Either.isRight(encoded)) {
              expect(encoded.right.resourceType).toBe('DiagnosticReport')
              expect(encoded.right.status).toBe(status)
              expect(encoded.right.code.text).toBe(codeText)
            }
          }
        }
      )
    )
  })

  test('property: DiagnosticReportStatus validates enum values', () => {
    // Property: Only valid DiagnosticReportStatus values should encode successfully
    fc.assert(
      fc.property(
        fc.constantFrom(
          'registered',
          'partial',
          'preliminary',
          'final',
          'amended',
          'corrected',
          'appended',
          'cancelled',
          'entered-in-error',
          'unknown'
        ),
        (status) => {
          const encode = Schema.encodeUnknownEither(DiagnosticReportStatus)
          const result = encode(status)
          expect(Either.isRight(result)).toBe(true)
        }
      )
    )
  })

  test('property: invalid DiagnosticReportStatus values fail', () => {
    // Property: Invalid status values should fail
    fc.assert(
      fc.property(
        fc
          .string()
          .filter(
            (s) =>
              ![
                'registered',
                'partial',
                'preliminary',
                'final',
                'amended',
                'corrected',
                'appended',
                'cancelled',
                'entered-in-error',
                'unknown',
              ].includes(s)
          ),
        (invalidStatus) => {
          const encode = Schema.encodeUnknownEither(DiagnosticReportStatus)
          const result = encode(invalidStatus)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
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
          const decode = Schema.decodeUnknownEither(DiagnosticReport)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })

  test('property: optional fields are preserved through encode-decode', () => {
    // Property: Optional fields like conclusion should be preserved
    fc.assert(
      fc.property(
        fc.constantFrom('final', 'preliminary', 'registered'),
        fc.string(),
        fc.option(fc.string(), { nil: undefined }),
        (status, codeText, conclusion) => {
          const decode = Schema.decodeUnknownEither(DiagnosticReport)
          const encode = Schema.encodeUnknownEither(DiagnosticReport)

          const report: {
            resourceType: 'DiagnosticReport'
            status: string
            code: { text: string }
            conclusion?: string
          } = {
            resourceType: 'DiagnosticReport',
            status,
            code: { text: codeText },
          }
          if (conclusion !== undefined) report.conclusion = conclusion

          const decoded = decode(report)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            if (Either.isRight(encoded)) {
              if (conclusion !== undefined) {
                expect(encoded.right.conclusion).toBe(conclusion)
              }
            }
          }
        }
      )
    )
  })

  test('property: encode is inverse of decode', () => {
    // Property: decode(encode(decode(x))) === decode(x)
    fc.assert(
      fc.property(
        fc.constantFrom('final', 'preliminary', 'registered'),
        fc.string(),
        (status, codeText) => {
          const decode = Schema.decodeUnknownEither(DiagnosticReport)
          const encode = Schema.encodeUnknownEither(DiagnosticReport)

          const report = {
            resourceType: 'DiagnosticReport' as const,
            status,
            code: { text: codeText },
          }

          const decoded1 = decode(report)
          if (Either.isRight(decoded1)) {
            const encoded = encode(decoded1.right)
            if (Either.isRight(encoded)) {
              const decoded2 = decode(encoded.right)
              expect(Either.isRight(decoded2)).toBe(true)
              if (Either.isRight(decoded2)) {
                expect(decoded2.right.status).toBe(decoded1.right.status)
                expect(decoded2.right.code.text).toBe(decoded1.right.code.text)
              }
            }
          }
        }
      )
    )
  })

  test('property: array fields are preserved', () => {
    // Property: Array fields like category, result should be preserved
    fc.assert(
      fc.property(
        fc.constantFrom('final', 'preliminary'),
        fc.string(),
        fc.option(
          fc.array(fc.record({ text: fc.string() }), {
            minLength: 0,
            maxLength: 3,
          }),
          { nil: undefined }
        ),
        (status, codeText, category) => {
          const decode = Schema.decodeUnknownEither(DiagnosticReport)
          const encode = Schema.encodeUnknownEither(DiagnosticReport)

          const report: {
            resourceType: 'DiagnosticReport'
            status: string
            code: { text: string }
            category?: Array<{ text: string }>
          } = {
            resourceType: 'DiagnosticReport',
            status,
            code: { text: codeText },
          }
          if (category !== undefined) report.category = category

          const decoded = decode(report)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            if (Either.isRight(encoded)) {
              if (category !== undefined) {
                expect(encoded.right.category?.length).toBe(category.length)
              }
            }
          }
        }
      )
    )
  })
})
