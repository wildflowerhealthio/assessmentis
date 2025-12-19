import { Effect } from 'effect'
import { Code, Coding } from '@assessmentis/clinical-domain/data-types'
import { QuestionnaireResponse } from '@assessmentis/clinical-domain/content-management'
import { gad7 } from '@assessmentis/questionnaire-entities'
import { makeScoringTable as makeScoringTableFunction } from '../../utility/scoringTable'
import { ReportProps } from './ReportProps'

type ResponseItem = NonNullable<QuestionnaireResponse['item']>[number]

const gad7ScoreByAnswerCode: Readonly<Record<string, number | undefined>> = {
  'LA6568-5': 0,
  'LA6569-3': 1,
  'LA6570-1': 2,
  'LA6571-9': 3,
}

const headerCodes: ReadonlyArray<Coding> = [
  {
    system: 'http://loinc.org',
    code: Code.make('LA6568-5'),
    display: 'Not at all',
  },
  {
    system: 'http://loinc.org',
    code: Code.make('LA6569-3'),
    display: 'Several days',
  },
  {
    system: 'http://loinc.org',
    code: Code.make('LA6570-1'),
    display: 'More than half the days',
  },
  {
    system: 'http://loinc.org',
    code: Code.make('LA6571-9'),
    display: 'Nearly every day',
  },
]

const gad7QuestionnaireItems = (() => {
  if (!gad7.item) {
    throw new Error('GAD-7 questionnaire definition missing items')
  }
  const items = gad7.item.slice(0, 7)
  if (items.length !== 7) {
    throw new Error('GAD-7 questionnaire definition missing required items')
  }
  return items
})()

export const makeGad7ScoringTable = makeScoringTableFunction(
  gad7QuestionnaireItems,
  (item) => {
    const answer = item?.answer?.[0]
    const answerCode =
      answer && 'valueCoding' in answer ? answer.valueCoding?.code : undefined
    return answerCode && answerCode in gad7ScoreByAnswerCode
      ? gad7ScoreByAnswerCode[answerCode]
      : undefined
  },
  headerCodes
)

const severityForTotal = (total: number) =>
  total >= 15
    ? 'Severe anxiety'
    : total >= 10
      ? 'Moderate anxiety'
      : total >= 5
        ? 'Mild anxiety'
        : 'Minimal anxiety'

export const prepareGad7ReportData = (
  response: QuestionnaireResponse
): Effect.Effect<ReportProps, string> => {
  if (!response.item) return Effect.fail('No items in QuestionnaireResponse')
  const responseByLinkId = new Map(
    response.item.map((item) => [item.linkId, item])
  )

  const responseItems: ResponseItem[] = []

  for (const questionnaireItem of gad7QuestionnaireItems) {
    const responseItem = responseByLinkId.get(questionnaireItem.linkId)
    if (!responseItem) {
      return Effect.fail(
        'QuestionnaireResponse missing answers for required GAD-7 items'
      )
    }
    responseItems.push(responseItem)
  }

  return makeGad7ScoringTable(responseItems).pipe(
    Effect.flatMap((scoreTableData) => {
      const buildRow = (idx: number) => {
        const questionItem = gad7QuestionnaireItems[idx]
        const row = scoreTableData.rows[idx]
        const cells: [string, string, string, string] = [
          row?.data?.[0] ?? '',
          row?.data?.[1] ?? '',
          row?.data?.[2] ?? '',
          row?.data?.[3] ?? '',
        ]

        return {
          question: questionItem.text ?? '',
          cells,
        }
      }

      const rows: ReportProps['rows'] = [
        buildRow(0),
        buildRow(1),
        buildRow(2),
        buildRow(3),
        buildRow(4),
        buildRow(5),
        buildRow(6),
      ]

      const totalScore = scoreTableData.totalScore

      return Effect.try({
        try: () =>
          ReportProps.make({
            title: { title: gad7.title },
            TableHeader: headerCodes.map((code) => code.display ?? ''),
            rows,
            scoring: {
              totalScore,
              subtitle: severityForTotal(totalScore),
              rangeExplanations: [
                '0-4: Minimal anxiety',
                '5-9: Mild anxiety',
                '10-14: Moderate anxiety',
                '15-21: Severe anxiety',
              ],
            },
          }),
        catch: (error) =>
          `Invalid GAD-7 report props derived from response: ${String(error)}`,
      })
    })
  )
}
