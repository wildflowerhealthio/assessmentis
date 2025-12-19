import {
  ScoringProps,
  TitleProps,
  TableRowProps,
  TableBodyProps,
} from './componentProps'

export interface SectionRenderers<Out> {
  Title: (props: TitleProps) => Out
  TableHeader: () => Out
  TableRow: (props: TableRowProps) => Out
  TableBody: (props: TableBodyProps<Out>) => Out
  Scoring: (props: ScoringProps) => Out
}
