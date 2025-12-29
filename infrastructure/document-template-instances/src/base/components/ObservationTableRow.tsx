import React from 'react'
import { ObservationTableRowProps } from '@assessmentis/document-template-kinds'

export const ObservationTableRow: React.FC<ObservationTableRowProps> = ({
  observation,
  columnCodings,
}) => {
  const answerCode =
    observation && 'valueCodeableConcept' in observation
      ? observation.valueCodeableConcept?.coding?.[0]?.code
      : undefined

  return (
    <tr>
      <td>{observation.code.text}</td>
      {columnCodings.map((codings) => (
        <td style={{ textAlign: 'center' }}>
          {answerCode && codings.some((coding) => coding.code === answerCode)
            ? `X`
            : ''}
        </td>
      ))}
    </tr>
  )
}
