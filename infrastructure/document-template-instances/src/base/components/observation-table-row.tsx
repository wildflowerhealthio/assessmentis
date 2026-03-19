import React from 'react'

import { CodeableConcept } from '@assessmentis/clinical-domain/data-types'
import type { ObservationTableRowProps } from '@assessmentis/document-template-kinds'

export const ObservationTableRow: React.FC<ObservationTableRowProps> = ({
  observation,
  columnCodings,
}) => {
  const answerCode = CodeableConcept.Datatype.from(observation.value)?.coding?.[0]?.code

  return (
    <tr>
      <td>{observation.code.text}</td>
      {columnCodings.map((codings, index) => (
        <td key={index} style={{ textAlign: 'center' }}>
          {answerCode && codings.some((coding) => coding.code === answerCode) ? `X` : ''}
        </td>
      ))}
    </tr>
  )
}
