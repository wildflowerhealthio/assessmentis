import { Schema } from 'effect'

export const TableBodyProps = <T>(contentSchema: Schema.Schema<T, string>) =>
  Schema.Struct({
    rows: Schema.Tuple(
      contentSchema,
      contentSchema,
      contentSchema,
      contentSchema,
      contentSchema,
      contentSchema,
      contentSchema
    ),
  })
export type TableBodyProps<T> = ReturnType<typeof TableBodyProps<T>>['Type']

export const ScoringProps = Schema.Struct({
  totalScore: Schema.Number,
  subtitle: Schema.optional(Schema.String),
  explainer: Schema.optional(Schema.String),
  rangeExplanations: Schema.optional(Schema.Array(Schema.String)),
})
export type ScoringProps = typeof ScoringProps.Type

export const TableRowProps = Schema.Struct({
  question: Schema.String,
  cells: Schema.Tuple(
    Schema.String,
    Schema.String,
    Schema.String,
    Schema.String
  ),
})
export type TableRowProps = typeof TableRowProps.Type

export const TitleProps = Schema.Struct({
  title: Schema.optional(Schema.String),
})
export type TitleProps = typeof TitleProps.Type
