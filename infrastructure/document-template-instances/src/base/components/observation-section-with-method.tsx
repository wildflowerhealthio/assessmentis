import { IntegerDatatype, Quantity } from '@assessmentis/clinical-domain/data-types'
import type { ObservationSectionWithMethodComponent } from '@assessmentis/document-template-kinds'

export const ObservationSectionWithMethod: ObservationSectionWithMethodComponent = ({
  observation,
}) => {
  const score: number | undefined =
    IntegerDatatype.from(observation.value) ?? Quantity.Datatype.from(observation.value)?.value

  const title = observation?.code?.text ?? ''

  const explainer = observation.method?.text ?? ''

  const rangeExplanations = observation?.referenceRange?.map(
    ({ low, high, text }) => `${low?.value}-${high?.value}: ${text}`
  )
  return (
    <div>
      <h2>{title}</h2>
      <strong>{score}</strong>
      <p>
        {explainer}
        {rangeExplanations ? (
          <ul>
            {rangeExplanations.map((explanation, index) => (
              <li key={index}>{explanation}</li>
            ))}
          </ul>
        ) : undefined}
      </p>
    </div>
  )
}
