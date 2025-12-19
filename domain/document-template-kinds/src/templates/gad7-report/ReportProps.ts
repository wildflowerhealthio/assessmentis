import { Schema } from 'effect'
import { TitleProps, TableRowProps, ScoringProps } from './componentProps'
import { Gad7TotalScoreObservation } from '@assessmentis/questionnaire-entities'

export const ReportProps = Schema.Struct({
  title: TitleProps,
  tableHeader: Schema.Any,
  totalScore: Gad7TotalScoreObservation,
  rows: Schema.Tuple(
    TableRowProps,
    TableRowProps,
    TableRowProps,
    TableRowProps,
    TableRowProps,
    TableRowProps,
    TableRowProps
  ),
  scoring: ScoringProps,
})
export type ReportProps = typeof ReportProps.Type
