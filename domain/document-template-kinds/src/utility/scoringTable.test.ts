import { describe, expect, test } from 'vitest'
import * as fc from 'fast-check'
import { Effect } from 'effect'
import {
  QuestionnaireItem,
  QuestionnaireItemLink,
  type QuestionnaireResponseItem,
} from '@assessmentis/clinical-domain/content-management'
import { Code, type Coding } from '@assessmentis/clinical-domain/data-types'
import { makeScoringTable } from './scoringTable'

const headerCodes: ReadonlyArray<Coding> = [
  {
    system: 'urn:test',
    code: Code.make('A'),
    display: 'Option A',
  },
  {
    system: 'urn:test',
    code: Code.make('B'),
    display: 'Option B',
  },
]

const questionnaireItems: QuestionnaireItem[] = ['q1', 'q2', 'q3'].map(
  (linkId) => ({
    type: 'question',
    linkId: QuestionnaireItemLink.make(linkId),
    text: `Question ${linkId}`,
    answerOption: headerCodes.map((code) => ({
      valueCoding: {
        system: code.system,
        code: code.code,
        display: code.display,
      },
    })),
  })
)

const getFirstAnswersCode = (item: QuestionnaireResponseItem) => {
  const answer = item.answer?.[0]
  if (answer && 'valueCoding' in answer) {
    return answer.valueCoding?.code
  }
  return undefined
}

const score = (item: QuestionnaireResponseItem) => {
  const code = getFirstAnswersCode(item)
  return code === 'A' ? 0 : code === 'B' ? 1 : undefined
}

const scorer = makeScoringTable(questionnaireItems, score, headerCodes)

const responseItemsArb = fc
  .tuple(
    fc.constantFrom<'A' | 'B'>('A', 'B'),
    fc.constantFrom<'A' | 'B'>('A', 'B'),
    fc.constantFrom<'A' | 'B'>('A', 'B')
  )
  .map((codes): QuestionnaireResponseItem[] =>
    codes.map((code, idx) => ({
      linkId: questionnaireItems[idx]!.linkId,
      answer: [
        {
          valueCoding: {
            system: 'urn:test',
            code: Code.make(code),
            display: code,
          },
        },
      ],
    }))
  )

describe('makeScoringTable', () => {
  test('property: rows and totals track selected codes', () => {
    fc.assert(
      fc.property(responseItemsArb, (responseItems) => {
        const result = Effect.runSync(scorer(responseItems))
        const expectedTotal = responseItems.reduce((sum, item) => {
          const code = getFirstAnswersCode(item)
          return sum + (code === 'A' ? 0 : 1)
        }, 0)

        expect(result.dataHeaders).toEqual(['Option A', 'Option B'])
        expect(result.rows).toHaveLength(responseItems.length)
        expect(result.totalScore).toBe(expectedTotal)

        result.rows.forEach((row, idx) => {
          const chosen = getFirstAnswersCode(responseItems[idx]!)
          const expectedScore = chosen === 'A' ? 0 : 1
          const expectedData = chosen
            ? headerCodes.map((header) =>
                header.code === chosen ? `${expectedScore}` : ''
              )
            : ['', '']

          expect(row.data).toEqual(expectedData)
          expect(row.score).toBe(expectedScore)
        })
      })
    )
  })

  test('fails when items array is empty', () => {
    const scorerWithNoItems = makeScoringTable([], score, headerCodes)
    expect(() => Effect.runSync(scorerWithNoItems([]))).toThrow(
      /No items provided/
    )
  })

  test('fails when an answer option is missing from header codes', () => {
    const brokenItems: QuestionnaireItem[] = [
      {
        type: 'question',
        linkId: QuestionnaireItemLink.make('broken'),
        text: 'Broken question',
        answerOption: [
          {
            valueCoding: {
              system: 'urn:test',
              code: Code.make('C'),
              display: 'Out of band',
            },
          },
        ],
      },
    ]

    const brokenScorer = makeScoringTable(brokenItems, score, headerCodes)

    expect(() =>
      Effect.runSync(
        brokenScorer([
          {
            linkId: QuestionnaireItemLink.make('broken'),
            answer: [
              {
                valueCoding: {
                  system: 'urn:test',
                  code: Code.make('C'),
                  display: 'Out of band',
                },
              },
            ],
          },
        ])
      )
    ).toThrow(/answer code not present in headerCodes/)
  })
})
