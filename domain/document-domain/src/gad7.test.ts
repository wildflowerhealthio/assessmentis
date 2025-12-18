import { Effect, Arbitrary } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  QuestionnaireItemLink,
  QuestionnaireResponseStatus,
  type QuestionnaireResponse,
} from '@assessmentis/clinical-domain/content-management'
import { gad7 as gad7Questionnaire } from '@assessmentis/questionnaire-domain'

import { prepareGad7ReportData } from './gad7'

const codeScores: Record<string, number> = {
  'LA6568-5': 0,
  'LA6569-3': 1,
  'LA6570-1': 2,
  'LA6571-9': 3,
}

const allowedCodes = Object.keys(codeScores)
const codesArb: fc.Arbitrary<string[]> = fc.array(
  fc.constantFrom(...allowedCodes),
  {
    minLength: 7,
    maxLength: 7,
  }
)

const responseArb = (codes: string[]): fc.Arbitrary<QuestionnaireResponse> =>
  fc.record({
    resourceType: fc.constant('QuestionnaireResponse'),
    status: Arbitrary.make(QuestionnaireResponseStatus),
    item: fc.tuple(
      ...codes.map((code, idx) => {
        const question = gad7Questionnaire.item?.[idx]
        return fc.record({
          linkId:
            question?.linkId != undefined
              ? fc.constant(question?.linkId)
              : Arbitrary.make(QuestionnaireItemLink),
          answer: fc.constant([
            {
              valueCoding: {
                system: 'http://loinc.org',
                code,
              },
            },
          ]),
        })
      })
    ),
  })

describe('prepareGad7ReportData', () => {
  it('succeeds and sums scores for valid answer codes', () => {
    fc.assert(
      fc.property(
        codesArb.chain((codes) =>
          fc.tuple(fc.constant(codes), responseArb(codes))
        ),
        ([codes, response]) => {
          const result = Effect.runSync(prepareGad7ReportData(response))

          expect(result.table.rows).toHaveLength(7)
          const expectedTotal = codes.reduce(
            (sum, code) => sum + (codeScores[code] ?? 0),
            0
          )
          expect(result.table.totalScore).toBe(expectedTotal)
        }
      )
    )
  })
})
