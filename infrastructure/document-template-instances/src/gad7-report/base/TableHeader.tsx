import { JsxCompositionSectionComponent } from '../../../../../domain/document-template-kinds/src/utility/JsxCompositionSection'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Coding,
  referenceFromResource,
  WithId,
} from '@assessmentis/clinical-domain/data-types'
import { Observation } from '../../../../../domain/clinical-domain/src/diagnostic-medicine/resources/Observation'
import { TableRow } from './TableRow'

export const ObservationTable: JsxCompositionSectionComponent<{
  group: { display: string; id: string; resourceType: string }
  observations: WithId<Observation>[]
  columns: ReadonlyArray<{
    label: string
    codings: ReadonlyArray<Coding>
  }>
}> = ({ group, observations, columns }) => {
  const rows = observations.map((observation) =>
    TableRow({
      observation,
      columnCodings: columns.map((c) => c.codings),
    })
  )

  const jsx = (
    <table>
      <thead>
        <tr>
          {columns.map(({ label }) => (
            <th>{label}</th>
          ))}
        </tr>
      </thead>
      <tbody>{rows.map((row) => row.jsx)}</tbody>
    </table>
  )

  return {
    jsx,
    compositionSection: {
      title: group.display,
      entry: [referenceFromResource(group)],
      text: {
        status: 'generated',
        div: renderToStaticMarkup(jsx),
      },
      section: rows.map((row) => row.compositionSection),
    },
  }
}
