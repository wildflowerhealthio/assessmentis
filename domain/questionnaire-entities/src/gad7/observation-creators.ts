import type { QuestionnaireResponse } from '@assessmentis/clinical-domain'
import { CodeableConcept, Coding, Reference } from '@assessmentis/clinical-domain/data-types'

import { codings } from './codings'
import { baseChoiceObservation } from './internal'
import type { ObservationInput, ObservationTemplate } from './internal'
import { totalScore } from './observations'

const questionLinkIds = ['57541', '57542', '57543', '57544', '57545', '57546', '57547'] as const

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

const findAnswerCoding = (
  response: QuestionnaireResponse,
  linkId: string
): CodeableConcept | undefined => {
  const firstAnswer = response.item?.find((item) => item.linkId === linkId)?.answer?.[0]
  const answerCoding = Coding.Datatype.from(firstAnswer?.value)
  if (answerCoding) {
    return CodeableConcept.make({
      coding: [answerCoding],
    })
  }
  return undefined
}

export const computeGad7HelperTotalScoreObservation = (
  response: QuestionnaireResponse
): Omit<ObservationInput, 'status'> => {
  const totalScoreValue = questionLinkIds.reduce((acc, linkId) => {
    const answerCoding = findAnswerCoding(response, linkId)
    if (!answerCoding?.coding?.[0]?.code) {
      return acc
    }

    const score = codingScore[String(answerCoding.coding[0].code)] ?? 0
    return acc + score
  }, 0)
  const responseResource = Reference.fromResource(response)

  let derivedFrom: [Reference] | undefined
  if (responseResource) {
    derivedFrom = [responseResource]
  } else {
    derivedFrom = undefined
  }

  return {
    ...totalScore,
    derivedFrom,
    encounter: response.encounter,
    value: { _tag: 'integer', integer: totalScoreValue },
  } as const
}

export const extractObservationsFromGad7Response = (
  response: QuestionnaireResponse
): Omit<ObservationInput, 'status'>[] => {
  const questionObsList = questionLinkIds.map((linkId) => {
    const code = questionCodeByLinkId[linkId]
    const answerCoding = findAnswerCoding(response, linkId)

    const responseResource = Reference.fromResource(response)
    let derivedFrom: [Reference] | undefined
    if (responseResource) {
      derivedFrom = [responseResource]
    } else {
      derivedFrom = undefined
    }

    let valueSpread:
      | { value: { CodeableConcept: CodeableConcept; _tag: 'CodeableConcept' } }
      | Record<string, never>
    if (answerCoding) {
      valueSpread = {
        value: {
          CodeableConcept: answerCoding,
          _tag: 'CodeableConcept' as const,
        },
      }
    } else {
      valueSpread = {}
    }

    return {
      ...baseChoiceObservation,
      code: CodeableConcept.make({
        coding: [code],
        text: code.display,
      }),
      derivedFrom,
      encounter: response.encounter,
      ...valueSpread,
    } satisfies ObservationTemplate
  })

  return [...questionObsList, computeGad7HelperTotalScoreObservation(response)]
}
