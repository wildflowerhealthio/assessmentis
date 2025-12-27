import { ObservationSectionWithMethodComponent } from '@assessmentis/document-template-kinds'

export const ObservationSectionWithMethod: ObservationSectionWithMethodComponent =
  ({ observation }) => {
    let score: number | undefined = undefined

    if ('valueInteger' in observation) {
      score = observation.valueInteger
    } else if ('valueQuantity' in observation) {
      score = observation.valueQuantity.value
    }

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
