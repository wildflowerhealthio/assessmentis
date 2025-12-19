import { TableRowProps } from '@assessmentis/document-template-kinds/gad7-report'

export const TableRow = (props: TableRowProps) => {
  const { question, cells } = props
  return (
    <tr>
      <td>{question}</td>
      <td>{cells[0]}</td>
      <td>{cells[1]}</td>
      <td>{cells[2]}</td>
      <td>{cells[3]}</td>
    </tr>
  )
}
