import type { Effect } from 'effect'

import type { QuestionnaireItem, QuestionnaireResponseItem } from '@assessmentis/clinical-domain'
import { Code, Coding } from '@assessmentis/clinical-domain/data-types'
import { gad7 } from '@assessmentis/questionnaire-entities'

import { makeScoringTable as makeScoringTableFunction } from '../../utility/scoring-table'
import type { ScoringTable } from '../../utility/scoring-table'

const gad7ScoreByAnswerCode: Readonly<Record<string, number | undefined>> = {
  'LA6568-5': 0,
  'LA6569-3': 1,
  'LA6570-1': 2,
  'LA6571-9': 3,
}

const headerCodes: readonly Coding[] = [
  Coding.make({
    code: Code.make('LA6568-5'),
    display: 'Not at all',
    system: 'http://loinc.org',
  }),
  Coding.make({
    code: Code.make('LA6569-3'),
    display: 'Several days',
    system: 'http://loinc.org',
  }),
  Coding.make({
    code: Code.make('LA6570-1'),
    display: 'More than half the days',
    system: 'http://loinc.org',
  }),
  Coding.make({
    code: Code.make('LA6571-9'),
    display: 'Nearly every day',
    system: 'http://loinc.org',
  }),
]

const gad7QuestionnaireItems = ((): QuestionnaireItem[] => {
  if (!gad7.questionnaire.item) {
    throw new Error('GAD-7 questionnaire definition missing items')
  }
  const items = gad7.questionnaire.item.slice(0, 7)
  if (items.length !== 7) {
    throw new Error('GAD-7 questionnaire definition missing required items')
  }
  return items
})()

export const makeGad7ScoringTable: (
  responseItems: QuestionnaireResponseItem[]
) => Effect.Effect<ScoringTable, string> = makeScoringTableFunction(
  gad7QuestionnaireItems,
  (item) => {
    const answer = item?.answer?.[0]
    const answerCode = Coding.Datatype.from(answer?.value)?.code
    if (answerCode && answerCode in gad7ScoreByAnswerCode) {
      return gad7ScoreByAnswerCode[answerCode]
    }
    return undefined
  },
  headerCodes
)
