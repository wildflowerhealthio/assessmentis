import { Link } from 'react-router'
import type {
  Observation,
  ObservationId,
} from '@assessmentis/clinical-domain/diagnostic-medicine'

function formatObservationValue(observation: Observation): string {
  // Handle different value types
  if ('valueQuantity' in observation && observation.valueQuantity) {
    const val = observation.valueQuantity.value || ''
    return val.toString()
  }

  if ('valueString' in observation && observation.valueString) {
    return observation.valueString
  }

  if ('valueInteger' in observation && observation.valueInteger !== undefined) {
    return observation.valueInteger.toString()
  }

  if (
    'valueCodeableConcept' in observation &&
    observation.valueCodeableConcept
  ) {
    return (
      observation.valueCodeableConcept.text ||
      observation.valueCodeableConcept.coding?.[0]?.display ||
      'Coded value'
    )
  }

  if ('valueBoolean' in observation && observation.valueBoolean !== undefined) {
    return observation.valueBoolean ? 'Yes' : 'No'
  }

  if ('valueDateTime' in observation && observation.valueDateTime) {
    return new Date(observation.valueDateTime.epochMillis).toLocaleString()
  }

  if ('dataAbsentReason' in observation && observation.dataAbsentReason) {
    return `Data absent: ${observation.dataAbsentReason.text || 'Unknown'}`
  }

  return 'See details'
}

const ObservationList = ({
  observations,
  deleteObservation,
}: {
  observations: { data: Observation; loading: boolean }[]
  deleteObservation: (id: ObservationId | undefined) => Promise<void>
}) => {
  return (
    <div>
      <h2 className="heading-3">Observation List</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {observations.map(({ data: observation, loading }, index) => {
          const displayName =
            observation.code.text ||
            observation.code.coding?.[0]?.display ||
            'Unknown observation'

          const effectiveDate = observation.effectiveDateTime
            ? new Date(
                observation.effectiveDateTime.epochMillis
              ).toLocaleDateString()
            : observation.effectivePeriod?.start
              ? new Date(
                  observation.effectivePeriod.start.epochMillis
                ).toLocaleDateString()
              : 'Unknown date'

          const value = formatObservationValue(observation)

          return (
            <li
              key={observation.id ?? index}
              style={{
                padding: 'var(--space-3)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                ...(loading ? { opacity: 0.5 } : {}),
              }}
            >
              <button
                className="button-3 ghost"
                onClick={() => deleteObservation(observation.id)}
                disabled={loading}
                aria-label="Delete observation"
                style={{ border: 'none' }}
              >
                ❌
              </button>
              <Link
                to={`/Observation/${observation.id}`}
                className="body-3"
                style={{
                  flex: 1,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <strong>{displayName}</strong>
                <div
                  style={{
                    fontSize: '0.9em',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Status: {observation.status} • {effectiveDate} • Value:{' '}
                  {value}
                </div>
              </Link>
            </li>
          )
        })}
        {observations.length === 0 && (
          <li
            className="body-3"
            style={{
              padding: 'var(--space-3)',
              color: 'var(--color-text-secondary)',
            }}
          >
            No observations found.
          </li>
        )}
      </ul>
    </div>
  )
}

export default ObservationList
