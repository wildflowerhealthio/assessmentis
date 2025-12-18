import { Effect, Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  QuestionnaireItemLink,
  QuestionnaireResponseStatus,
  Composition,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain/content-management'
import { Reference } from '@assessmentis/clinical-domain/data-types'
import { gad7 as gad7Questionnaire } from '@assessmentis/questionnaire-entities'

import {
  prepareGad7ReportData,
  gad7CompositionTemplate,
  gad7QuestionSectionTemplate,
  gad7SummarySectionTemplate,
} from './gad7'

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
    subject: fc.constant(
      Reference.make({ reference: 'Patient/example', display: 'Test Patient' })
    ),
    authored: fc.constant(new Date().toISOString()),
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

describe('gad7 Section Templates', () => {
  it('gad7QuestionSectionTemplate produces valid CompositionSection', () => {
    const result = Effect.runSync(
      gad7QuestionSectionTemplate.render({
        questionText: 'Feeling nervous, anxious or on edge',
        answerText: 'Several days',
        score: 1,
      })
    )

    expect(result.title).toBe('Feeling nervous, anxious or on edge')
    expect(result.text).toBeDefined()
    expect(result.text?.status).toBe('generated')
    expect(result.code).toBeDefined()
  })

  it('gad7SummarySectionTemplate produces valid CompositionSection', () => {
    const result = Effect.runSync(
      gad7SummarySectionTemplate.render({
        totalScore: 10,
        interpretation: 'Moderate anxiety',
      })
    )

    expect(result.title).toBe('GAD-7 Total Score and Interpretation')
    expect(result.text).toBeDefined()
    expect(result.text?.div).toContain('Total Score: 10')
    expect(result.text?.div).toContain('Moderate anxiety')
  })
})

describe('gad7CompositionTemplate', () => {
  it('produces valid Composition from arbitrary QuestionnaireResponse', () => {
    fc.assert(
      fc.property(
        codesArb.chain((codes) => responseArb(codes)),
        (response) => {
          const composition = Effect.runSync(
            gad7CompositionTemplate.render(response)
          )

          // Verify it's a valid Composition
          expect(composition.resourceType).toBe('Composition')
          expect(composition.status).toBe('final')
          expect(composition.title).toBe(
            'Generalized Anxiety Disorder (GAD-7) Assessment Report'
          )

          // Verify sections exist
          expect(composition.section).toBeDefined()
          expect(composition.section?.length).toBe(8) // 1 summary + 7 questions

          // Verify composition can be encoded
          const encoded = Schema.encodeSync(Composition)(composition)
          expect(encoded.resourceType).toBe('Composition')
        }
      )
    )
  })

  it('fails when QuestionnaireResponse has fewer than 7 items', () => {
    const invalidResponse = Schema.decodeSync(QuestionnaireResponse)({
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      item: [
        {
          linkId: '1',
          answer: [{ valueCoding: { code: 'LA6568-5' } }],
        },
      ],
    })

    const result = Effect.runSync(
      Effect.either(gad7CompositionTemplate.render(invalidResponse))
    )

    expect(result._tag).toBe('Left')
  })

  it('produces Composition with correct interpretation for different scores', () => {
    const testCases = [
      { codes: Array(7).fill('LA6568-5'), expected: 'Minimal anxiety' },
      { codes: Array(7).fill('LA6569-3'), expected: 'Mild anxiety' },
      { codes: Array(7).fill('LA6570-1'), expected: 'Moderate anxiety' },
      { codes: Array(7).fill('LA6571-9'), expected: 'Severe anxiety' },
    ]

    testCases.forEach(({ codes, expected }) => {
      const response = fc.sample(responseArb(codes), 1)[0]
      const composition = Effect.runSync(
        gad7CompositionTemplate.render(response)
      )

      const summarySection = composition.section?.[0]
      expect(summarySection?.text?.div).toContain(expected)
    })
  })
})
