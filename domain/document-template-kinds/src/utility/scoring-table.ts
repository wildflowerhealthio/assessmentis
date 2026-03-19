import { Effect, Schema } from 'effect'

import type { QuestionnaireItem, QuestionnaireResponseItem } from '@assessmentis/clinical-domain'
import { Coding } from '@assessmentis/clinical-domain/data-types'

export const ScoringTable = Schema.Struct({
  dataHeaders: Schema.Array(Schema.String),
  rows: Schema.Array(
    Schema.Struct({
      data: Schema.Array(Schema.String),
      question: Schema.optional(Schema.String),
      score: Schema.optional(Schema.Number),
    })
  ),
  totalScore: Schema.Number,
})

export type ScoringTable = typeof ScoringTable.Type

export const makeScoringTable =
  (
    items: QuestionnaireItem[],
    score: (item: QuestionnaireResponseItem) => undefined | number,
    headerCodes: readonly Coding[]
  ) =>
  (responseItems: QuestionnaireResponseItem[]): Effect.Effect<ScoringTable, string> => {
    if (items.length === 0) {
      return Effect.fail('No items provided')
    }

    if (
      !items.every(
        (item) =>
          item.answerOption?.every(({ value }) =>
            headerCodes.some((hc) => hc.code === Coding.Datatype.from(value)?.code)
          ) ?? false
      )
    ) {
      return Effect.fail('An item has an answer code not present in headerCodes')
    }

    let totalScore = 0

    const rows = responseItems.map((responseItem) => {
      const item = items.find((i) => i.linkId === responseItem.linkId) ?? undefined
      const answer = responseItem?.answer?.[0]
      const answerCode = Coding.Datatype.from(answer?.value)?.code
      const itemScore = (answerCode && score(responseItem)) ?? undefined
      totalScore += itemScore ?? 0

      return {
        data: headerCodes.map(({ code }) => {
          if (answerCode === code) {
            return `${itemScore}`
          }
          return ''
        }),
        question: item?.text,
        score: itemScore,
      }
    })

    return Effect.succeed(
      ScoringTable.make({
        dataHeaders: headerCodes.map((coding) => coding.display ?? ''),
        rows,
        totalScore,
      })
    )
  }
