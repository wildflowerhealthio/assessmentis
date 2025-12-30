import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

import { totalScore } from './observations'
import codings from './codings'
import {
  QuestionnaireItemLink,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
} from '@assessmentis/clinical-domain/content-management'
import { Arbitrary } from 'effect'
import {
  computeGad7HelperTotalScoreObservation,
  extractObservationsFromGad7Response,
} from './observationCreators'
import { literalOf } from '@assessmentis/util'

const scoreToCoding = [
  codings.notAtAll,
  codings.severalDays,
  codings.moreThanHalfTheDays,
  codings.nearlyEveryDay,
] as const

const literalQuestionnaireItemLink = literalOf(QuestionnaireItemLink)

const questionLinkIds = [
  literalQuestionnaireItemLink('57541'),
  literalQuestionnaireItemLink('57542'),
  literalQuestionnaireItemLink('57543'),
  literalQuestionnaireItemLink('57544'),
  literalQuestionnaireItemLink('57545'),
  literalQuestionnaireItemLink('57546'),
  literalQuestionnaireItemLink('57547'),
] as const

const linkIdToQuestionCoding = [
  codings.feelingNervous,
  codings.notAbleToStopWorrying,
  codings.worryingTooMuch,
  codings.troubleRelaxing,
  codings.restlessHardToSitStill,
  codings.easilyAnnoyed,
  codings.feelingAfraid,
] as const

const buildResponse = (scores: ReadonlyArray<number | null>) =>
  Arbitrary.make(QuestionnaireResponse).chain(({ item: _, ...qr }) =>
    fc
      .array(Arbitrary.make(QuestionnaireResponseItem), {
        minLength: 7,
        maxLength: 7,
      })
      .map(
        (items): QuestionnaireResponse => ({
          ...qr,
          item: items.map((item, idx) => {
            const { linkId: _, answer: __, ...qri } = item
            const linkId = questionLinkIds[idx]
            const score = scores[idx]
            return score === null
              ? { ...qri, linkId }
              : {
                  ...qri,
                  linkId,
                  answer: [
                    {
                      valueCoding: scoreToCoding[score],
                    },
                  ],
                }
          }),
        })
      )
  )

describe('GAD-7 observations extraction', () => {
  it(
    'returns seven question observations plus total with correct codings and score',
    { timeout: 25_000 },
    () => {
      const scoresArb = fc.array(fc.option(fc.integer({ min: 0, max: 3 })), {
        minLength: 7,
        maxLength: 7,
      })

      fc.assert(
        fc.property(
          scoresArb.chain((scores) =>
            buildResponse(scores).map((response) => [scores, response] as const)
          ),
          ([maybeScores, response]) => {
            const scores = maybeScores.map((v) => (v === null ? undefined : v))

            const observations = extractObservationsFromGad7Response(response)

            expect(observations).toHaveLength(8)

            const questionObs = observations.slice(0, 7)

            questionObs.forEach((obs, idx) => {
              expect(obs.resourceType).toBe('Observation')
              expect(obs.category?.[0]?.coding?.[0]?.code).toBe('survey')
              expect(obs.code.coding?.[0]).toEqual(linkIdToQuestionCoding[idx])

              const expectedScore = scores[idx]
              if (expectedScore === undefined) {
                expect(obs).not.toHaveProperty('valueCodeableConcept')
              } else {
                expect(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (obs as any).valueCodeableConcept.coding[0].code
                ).toEqual(scoreToCoding[expectedScore].code)
              }
            })

            const totalObservation = observations[7]
            const expectedTotal = scores.reduce(
              (acc: number, score) => acc + (score ?? 0),
              0
            )
            expect(
              'valueInteger' in totalObservation &&
                totalObservation.valueInteger
            ).toBe(expectedTotal)
            expect(totalObservation.code).toEqual(totalScore.code)

            const recomputed = computeGad7HelperTotalScoreObservation(response)
            expect(
              'valueInteger' in recomputed && recomputed.valueInteger
            ).toBe(expectedTotal)
          }
        )
      )
    }
  )
})
