import { QuestionnaireResponse } from '@assessmentis/clinical-domain/content-management'
import { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import codings from './codings'
import { totalScore } from './observations'
import { baseChoiceObservation, ObservationTemplate } from './internal'

const questionLinkIds = [
  '57541',
  '57542',
  '57543',
  '57544',
  '57545',
  '57546',
  '57547',
] as const

const codingScore: Record<string, number> = {
  [codings.notAtAll.code]: 0,
  [codings.severalDays.code]: 1,
  [codings.moreThanHalfTheDays.code]: 2,
  [codings.nearlyEveryDay.code]: 3,
}

const questionCodeByLinkId: Record<
  (typeof questionLinkIds)[number],
  (typeof codings)[keyof typeof codings]
> = {
  '57541': codings.feelingNervous,
  '57542': codings.notAbleToStopWorrying,
  '57543': codings.worryingTooMuch,
  '57544': codings.troubleRelaxing,
  '57545': codings.restlessHardToSitStill,
  '57546': codings.easilyAnnoyed,
  '57547': codings.feelingAfraid,
}

const findAnswerCoding = (response: QuestionnaireResponse, linkId: string) => {
  const firstAnswer = response.item?.find((item) => item.linkId === linkId)
    ?.answer?.[0]
  return firstAnswer && 'valueCoding' in firstAnswer
    ? firstAnswer.valueCoding
    : undefined
}

export const computeGad7HelperTotalScoreObservation = (
  response: QuestionnaireResponse
) => {
  const totalScoreValue = questionLinkIds.reduce((acc, linkId) => {
    const answerCoding = findAnswerCoding(response, linkId)
    if (!answerCoding?.code) return acc

    const score = codingScore[String(answerCoding.code)] ?? 0
    return acc + score
  }, 0)

  return {
    ...totalScore,
    valueInteger: totalScoreValue,
  }
}

export const extractObservationsFromGad7Response = (
  response: QuestionnaireResponse
): Omit<Observation, 'status'>[] => {
  const questionObsList = questionLinkIds.map((linkId) => {
    const code = questionCodeByLinkId[linkId]
    const answerCoding = findAnswerCoding(response, linkId)

    return {
      ...baseChoiceObservation,
      code: {
        coding: [code],
        text: code.display,
      },
      ...(answerCoding ? { valueCoding: answerCoding } : {}),
    } as const satisfies ObservationTemplate
  })

  return [...questionObsList, computeGad7HelperTotalScoreObservation(response)]
}
