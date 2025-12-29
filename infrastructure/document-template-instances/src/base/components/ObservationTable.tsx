import React from 'react'
import { ObservationTableRow } from './ObservationTableRow'
import { ObservationTableComponent } from '@assessmentis/document-template-kinds'

export const ObservationTable: ObservationTableComponent = ({
  observationLabel,
  observations,
  columns,
}) => {
  const rows = observations.map(
    (observation): JSX.Element => (
      <ObservationTableRow
        observation={observation}
        columnCodings={columns.map((c) => c.codings)}
      />
    )
  )

  return (
    <table>
      <thead>
        <tr>
          <th>{observationLabel}</th>
          {columns.map(({ label }) => (
            <th>{label}</th>
          ))}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  )
}
