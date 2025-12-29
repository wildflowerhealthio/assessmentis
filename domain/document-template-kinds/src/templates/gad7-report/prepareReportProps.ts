import { Code, Coding } from '@assessmentis/clinical-domain/data-types'
import { gad7 } from '@assessmentis/questionnaire-entities'
import { makeScoringTable as makeScoringTableFunction } from '../../utility/scoringTable'

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
  if (!gad7.questionnaire.item) {
    throw new Error('GAD-7 questionnaire definition missing items')
  }
  const items = gad7.questionnaire.item.slice(0, 7)
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
