import { type TableBodyProps } from '@assessmentis/document-template-kinds/gad7-report'

export const TableBody = (props: TableBodyProps<JSX.Element>) => {
  const { rows } = props
  return (
    <tbody>
      {rows[0].out}
      {rows[1].out}
      {rows[2].out}
      {rows[3].out}
      {rows[4].out}
      {rows[5].out}
      {rows[6].out}
    </tbody>
  )
}
