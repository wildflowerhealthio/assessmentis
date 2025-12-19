import { Schema } from 'effect'
import { TitleProps, TableRowProps, ScoringProps } from './componentProps'

export const ReportProps = Schema.Struct({
  title: TitleProps,
  TableHeader: Schema.Unknown,
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
