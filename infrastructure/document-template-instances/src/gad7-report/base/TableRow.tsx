import { Coding } from '../../../../../domain/clinical-domain/src/data-types/complex'
import { Observation } from '../../../../../domain/clinical-domain/src/diagnostic-medicine/resources/Observation'
import { JsxCompositionSectionComponent } from '@assessmentis/document-template-kinds'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  referenceFromResource,
  WithId,
} from '@assessmentis/clinical-domain/data-types'

export const TableRow: JsxCompositionSectionComponent<{
  observation: WithId<Observation>
  columnCodings: ReadonlyArray<ReadonlyArray<Coding>>
}> = ({ observation, columnCodings }) => {
  const answerCode =
    observation && 'valueCoding' in observation
      ? observation.valueCoding?.code
      : undefined

  const jsx = (
    <tr>
      <td>{observation.code.text}</td>
      {columnCodings.map((codings) => (
        <td>
          {answerCode && codings.some((coding) => coding.code === answerCode)
            ? `X`
            : ''}
        </td>
      ))}
    </tr>
  )

  const observationReference = referenceFromResource(observation)
  return {
    jsx,
    compositionSection: {
      title: observation.code.text,
      entry: observationReference ? [observationReference] : [],
      text: {
        status: 'generated',
        div: renderToStaticMarkup(jsx),
      },
    },
  }
}

// yield *
//   assertNoChildren({
//     children,
//     path: ['gad7-report', 'base', 'TableRow'],
//   })
// yield *
//   assertExists({
//     value: question.text,
//     name: 'Question text',
//     path: ['gad7-report', 'base', 'TableRow'],
//   })

// yield *
//   assertExists({
//     value: answerCode,
//     name: 'Question answer',
//     path: ['gad7-report', 'base', 'TableRow'],
//   })
