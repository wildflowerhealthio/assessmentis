import { type TableBodyProps } from '@assessmentis/document-template-kinds/gad7-report'

export const TableBody = (props: TableBodyProps<JSX.Element>) => {
  const { rows } = props
  return (
    <tbody>
      {rows[0]}
      {rows[1]}
      {rows[2]}
      {rows[3]}
      {rows[4]}
      {rows[5]}
      {rows[6]}
    </tbody>
  )
}
