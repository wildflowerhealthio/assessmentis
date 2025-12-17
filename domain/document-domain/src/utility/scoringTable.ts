import { Option, Schema } from 'effect'
import {
  Coding,
  QuestionnaireResponseItem,
  type QuestionnaireItem,
} from '@assessmentis/clinical-domain'

export const ScoringTable = Schema.Struct({
  dataHeaders: Schema.Array(Schema.String),
  rows: Schema.Array(
    Schema.Struct({
      question: Schema.optional(Schema.String),
      data: Schema.Array(Schema.String),
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
  (responseItems: QuestionnaireResponseItem[]): Option.Option<ScoringTable> => {
    if (items.length === 0) return Option.none()

    const answerOptionValueCodings = Option.all(
      items[0].answerOption?.map((option) =>
        Option.fromNullable(
          'valueCoding' in option ? option.valueCoding : undefined
        )
      ) ?? [Option.none()]
    ).pipe(Option.getOrUndefined)
    if (!answerOptionValueCodings) return Option.none()

    if (
      !items.every(
        (item) =>
          item.answerOption?.every(
            (option, idx) =>
              'valueCoding' in option &&
              option.valueCoding?.code === answerOptionValueCodings[idx].code
          ) ?? false
      )
    ) {
      return Option.none() // All items don't have the same answer options
      // if (!items.every((item) => item.answerOption && item.answerOption.length > 0))
    }

    let totalScore = 0

    const rows = responseItems.map((responseItem) => {
      const item =
        items.find((i) => i.linkId === responseItem.linkId) ?? undefined
      const answer = responseItem?.answer?.[0]
      const answerCode =
        answer && 'valueCoding' in answer ? answer.valueCoding.code : undefined
      const itemScore = (answerCode && score(responseItem)) ?? undefined
      totalScore += itemScore ?? 0

      return {
        question: item?.text,
        data: headerCodes.map(({ code }) =>
          answerCode == code ? `${itemScore}` : ''
        ),
        score,
      }
    })

    return Option.some(
      ScoringTable.make({
        dataHeaders: answerOptionValueCodings.map(
          (coding) => coding.display || ''
        ),
        rows,
        totalScore,
      })
    )
  }
