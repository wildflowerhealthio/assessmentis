import { Effect, Schema, Option } from 'effect'
import {
  Code,
  Encounter,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain'
import { gad7 } from '@assessmentis/questionnaire-domain'
import { makeScoringTable, ScoringTable } from './utility/scoringTable'

const makeGad7ScoringTable = makeScoringTable(
  gad7.item!.slice(0, 7),
  (item) => {
    const codeScores = {
      'LA6568-5': 0,
      'LA6569-3': 1,
      'LA6570-1': 2,
      'LA6571-9': 3,
    } as Record<string, number | undefined>
    const answer = item?.answer?.[0]
    const answerCode =
      answer && 'valueCoding' in answer ? answer.valueCoding?.code : undefined
    return answerCode && answerCode in codeScores
      ? codeScores[answerCode]
      : undefined
  },
  [
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
      code: Code.make('LA18938-3'),
      display: 'More days than not',
    },
    {
      system: 'http://loinc.org',
      code: Code.make('LA6571-9'),
      display: 'Nearly every day',
    },
  ]
)

export const prepareGad7ReportData = (
  encounter: Encounter,
  response: QuestionnaireResponse
) => {
  if (!response.item) return Effect.fail('No items in QuestionnaireResponse')

  const scoreTableData = makeGad7ScoringTable(response.item.slice(0, 7)).pipe(
    Option.getOrUndefined
  )

  if (!scoreTableData)
    return Effect.fail('Could not prepare GAD-7 scoring table')

  return Effect.succeed(Gad7ReportProps.make({ table: scoreTableData }))
}

export const Gad7ReportProps = Schema.Struct({
  table: ScoringTable,
})

export type Gad7ReportProps = typeof Gad7ReportProps.Type
