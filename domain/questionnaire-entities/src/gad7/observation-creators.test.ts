import { Arbitrary } from 'effect'
import fc from 'fast-check'
import { assert, describe, expect, it } from 'vitest'

import {
  QuestionnaireItemLink,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
} from '@assessmentis/clinical-domain'
import type { CodeableConcept } from '@assessmentis/clinical-domain/data-types'
import { literalOf } from '@assessmentis/util'

import { codings } from './codings'
import {
  computeGad7HelperTotalScoreObservation,
  extractObservationsFromGad7Response,
} from './observation-creators'
import { totalScore } from './observations'

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

const buildResponse = (scores: readonly (number | null)[]) =>
  Arbitrary.make(QuestionnaireResponse).chain(({ item: _, ...qr }) =>
    fc
      .array(Arbitrary.make(QuestionnaireResponseItem), {
        maxLength: 7,
        minLength: 7,
      })
      .map(
        (items): QuestionnaireResponse =>
          QuestionnaireResponse.make({
            ...qr,
            item: items.map((item, idx) => {
              const { linkId: _, answer: __, ...qri } = item
              const linkId = questionLinkIds[idx]
              const score = scores[idx]
              return QuestionnaireResponseItem.make(
                // oxlint-disable-next-line eslint/no-ternary
                score === null
                  ? { ...qri, linkId }
                  : {
                      ...qri,
                      answer: [
                        QuestionnaireResponseItemAnswer.make({
                          value: {
                            _tag: 'Coding',
                            Coding: scoreToCoding[score],
                          },
                        }),
                      ],
                      linkId,
                    }
              )
            }),
          })
      )
  )

describe('GAD-7 observations extraction', () => {
  it('returns seven question observations plus total with correct codings and score', () => {
    const scoresArb = fc.array(fc.option(fc.integer({ max: 3, min: 0 })), {
      maxLength: 7,
      minLength: 7,
    })

    fc.assert(
      fc.property(
        scoresArb.chain((scores) =>
          buildResponse(scores).map((response) => [scores, response] as const)
        ),
        ([maybeScores, response]) => {
          const scores = maybeScores.map((v) => v ?? undefined)

          const observations = extractObservationsFromGad7Response(response)

          expect(observations).toHaveLength(8)

          const questionObs = observations.slice(0, 7)

          questionObs.forEach((obs, idx) => {
            expect(obs.domainType).toBe('Observation')
            expect(obs.category?.[0]?.coding?.[0]?.code).toBe('survey')
            expect(obs.code.coding?.[0]).toEqual(linkIdToQuestionCoding[idx])

            const expectedScore = scores[idx]
            if (expectedScore === undefined) {
              expect(obs).not.toHaveProperty('valueCodeableConcept')
            } else {
              assert.property(obs, 'valueCodeableConcept')
              if ('valueCodeableConcept' in obs) {
                expect((obs.valueCodeableConcept as CodeableConcept)?.coding?.[0]?.code).toEqual(
                  scoreToCoding[expectedScore].code
                )
              }
            }
          })

          const totalObservation = observations[7]
          const expectedTotal = scores.reduce((acc: number, score) => acc + (score ?? 0), 0)
          expect('valueInteger' in totalObservation && totalObservation.valueInteger).toBe(
            expectedTotal
          )
          expect(totalObservation.code).toEqual(totalScore.code)

          const recomputed = computeGad7HelperTotalScoreObservation(response)
          expect('valueInteger' in recomputed && recomputed.valueInteger).toBe(expectedTotal)
        }
      ),
      { numRuns: 20 }
    )
  })
})
