import { Schema } from 'effect'
import { IntermediateCompositionSection } from '../../utility/IntermediateComposition'
import { Gad7TotalScoreObservation } from '../../../../questionnaire-entities/src/gad7-observation'

export const TableBodyProps = <T>(contentSchema: Schema.Schema<T, string>) =>
  Schema.Struct({
    rows: Schema.Tuple(
      IntermediateCompositionSection(contentSchema),
      IntermediateCompositionSection(contentSchema),
      IntermediateCompositionSection(contentSchema),
      IntermediateCompositionSection(contentSchema),
      IntermediateCompositionSection(contentSchema),
      IntermediateCompositionSection(contentSchema),
      IntermediateCompositionSection(contentSchema)
    ),
  })
export type TableBodyProps<T> = ReturnType<typeof TableBodyProps<T>>['Type']

export const ScoringProps = Schema.Struct({
  totalScore: Gad7TotalScoreObservation,
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
