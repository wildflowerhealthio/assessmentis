import React from 'react'

import type { ObservationTableComponent } from '@assessmentis/document-template-kinds'

import { ObservationTableRow } from './ObservationTableRow'

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
