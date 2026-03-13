import React from 'react'

import type { ObservationTableRowProps } from '@assessmentis/document-template-kinds'
import { CodeableConcept } from '@assessmentis/clinical-domain/data-types'

export const ObservationTableRow: React.FC<ObservationTableRowProps> = ({
  observation,
  columnCodings,
}) => {
  const answerCode = CodeableConcept.Datatype.from(observation.value)
    ?.coding?.[0]?.code

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
