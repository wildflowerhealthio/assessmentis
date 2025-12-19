import { describe, expect, test } from 'vitest'
import * as fc from 'fast-check'
import { Arbitrary, Effect } from 'effect'
import { prepareGad7ReportData } from './gad7'
import { gad7 } from '@assessmentis/questionnaire-entities'
import { QuestionnaireResponse } from '@assessmentis/clinical-domain/content-management'
import { Code } from '@assessmentis/clinical-domain/data-types'

const gad7Items = (() => {
  if (!gad7.item) {
    throw new Error('GAD-7 questionnaire items unavailable for tests')
  }
  return gad7.item.slice(0, 7)
})()

const allowedCodes = ['LA6568-5', 'LA6569-3', 'LA6570-1', 'LA6571-9'] as const

const scoreByCode: Record<(typeof allowedCodes)[number], number> = {
  'LA6568-5': 0,
  'LA6569-3': 1,
  'LA6570-1': 2,
  'LA6571-9': 3,
}

const severityForTotal = (total: number) =>
  total >= 15
    ? 'Severe anxiety'
    : total >= 10
      ? 'Moderate anxiety'
      : total >= 5
        ? 'Mild anxiety'
        : 'Minimal anxiety'

const responseArb = fc
  .tuple(
    fc.constantFrom(...allowedCodes),
    fc.constantFrom(...allowedCodes),
    fc.constantFrom(...allowedCodes),
    fc.constantFrom(...allowedCodes),
    fc.constantFrom(...allowedCodes),
    fc.constantFrom(...allowedCodes),
    fc.constantFrom(...allowedCodes)
  )
  .chain((codes) =>
    Arbitrary.make(QuestionnaireResponse).map((qr) => ({
      ...qr,
      item: codes.map((code, idx) => ({
        linkId: gad7Items[idx]?.linkId ?? String(idx),
        answer: [
          {
            valueCoding: {
              system: 'http://loinc.org',
              code,
              display: 'answer',
            },
          },
        ],
      })),
    }))
  )

describe('prepareGad7ReportData', () => {
  test('property: scoring rows and totals align with responses', () => {
    fc.assert(
      fc.property(responseArb, (response) => {
        const report = Effect.runSync(prepareGad7ReportData(response))

        const expectedTotal = (response.item ?? []).reduce((sum, item) => {
          const code = item.answer?.[0]?.valueCoding?.code
          return (
            sum + (code ? scoreByCode[code as keyof typeof scoreByCode] : 0)
          )
        }, 0)

        expect(report.rows).toHaveLength(7)
        expect(report.scoring.totalScore).toBe(expectedTotal)
        expect(report.scoring.subtitle).toBe(severityForTotal(expectedTotal))

        report.rows.forEach((row, idx) => {
          const answerCode =
            response.item?.[idx]?.answer?.[0]?.valueCoding?.code
          const expectedScore = answerCode
            ? scoreByCode[answerCode as keyof typeof scoreByCode]
            : undefined
          const expectedCells = allowedCodes.map((code) =>
            code === answerCode ? `${expectedScore}` : ''
          )

          expect(row.question).toBe(gad7Items[idx]?.text ?? '')
          expect(row.cells).toEqual(expectedCells)
        })
      })
    )
  })

  test('fails when QuestionnaireResponse has no items', () => {
    const emptyResponse = {
      resourceType: 'QuestionnaireResponse',
    } as QuestionnaireResponse

    expect(() => Effect.runSync(prepareGad7ReportData(emptyResponse))).toThrow(
      /No items in QuestionnaireResponse/
    )
  })

  test('fails when a required item is missing', () => {
    const partialResponse: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      item: [
        {
          linkId: gad7Items[0]?.linkId ?? 'missing',
          answer: [
            {
              valueCoding: {
                system: 'http://loinc.org',
                code: Code.make(allowedCodes[0]),
                display: 'answer',
              },
            },
          ],
        },
      ],
    }

    expect(() =>
      Effect.runSync(prepareGad7ReportData(partialResponse))
    ).toThrow(/missing answers for required GAD-7 items/)
  })
})
