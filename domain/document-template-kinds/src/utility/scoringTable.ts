import { Effect, Schema } from 'effect'
import type {
  QuestionnaireItem,
  QuestionnaireResponseItem,
} from '@assessmentis/clinical-domain'
import type { Coding } from '@assessmentis/clinical-domain/data-types'

export const ScoringTable = Schema.Struct({
  dataHeaders: Schema.Array(Schema.String),
  rows: Schema.Array(
    Schema.Struct({
      question: Schema.optional(Schema.String),
      data: Schema.Array(Schema.String),
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
    headerCodes: ReadonlyArray<Coding>
  ) =>
  (
    responseItems: QuestionnaireResponseItem[]
  ): Effect.Effect<ScoringTable, string> => {
    if (items.length === 0) return Effect.fail('No items provided')

    if (
      !items.every(
        (item) =>
          item.answerOption?.every(
            (option) =>
              'valueCoding' in option &&
              headerCodes.some(
                (hc) =>
                  hc.code ===
                  (option.valueCoding as Coding | undefined)?.code
              )
          ) ?? false
      )
    ) {
      return Effect.fail(
        'An item has an answer code not present in headerCodes'
      )
    }

    let totalScore = 0

    const rows = responseItems.map((responseItem) => {
      const item =
        items.find((i) => i.linkId === responseItem.linkId) ?? undefined
      const answer = responseItem?.answer?.[0]
      const answerCode =
        answer && answer.valueCoding
          ? (answer.valueCoding as Coding)?.code
          : undefined
      const itemScore = (answerCode && score(responseItem)) ?? undefined
      totalScore += itemScore ?? 0

      return {
        question: item?.text,
        data: headerCodes.map(({ code }) =>
          answerCode == code ? `${itemScore}` : ''
        ),
        score: itemScore,
      }
    })

    return Effect.succeed(
      ScoringTable.make({
        dataHeaders: headerCodes.map((coding) => coding.display || ''),
        rows,
        totalScore,
      })
    )
  }
