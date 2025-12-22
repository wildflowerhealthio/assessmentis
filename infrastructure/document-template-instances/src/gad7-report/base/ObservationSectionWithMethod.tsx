import { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { type WithId } from '@assessmentis/clinical-domain/data-types'

export const ObservationSectionWithMethod = ({
  totalScoreObservation,
}: {
  totalScoreObservation: WithId<Observation>
}) => {
  let score: number | undefined = undefined

  if ('valueInteger' in totalScoreObservation) {
    score = totalScoreObservation.valueInteger
  } else if ('valueQuantity' in totalScoreObservation) {
    score = totalScoreObservation.valueQuantity.value
  }

  const title =
    totalScoreObservation?.code?.text ?? 'Scoring GAD-7 Anxiety Severity'

  const explainer = totalScoreObservation.method?.text ?? ''

  const rangeExplanations = totalScoreObservation?.referenceRange?.map(
    ({ low, high, text }) => `${low?.value}-${high?.value}: ${text}`
  )
  return (
    <div>
      <h2>{title}</h2>
      Total Score: <strong>{score}</strong>
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
