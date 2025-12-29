import { Effect, Option, Schema } from 'effect'
import {
  Observation,
  ObservationId,
  ObservationRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Observation.$observationId._index'
import { getRuntime } from '../clientRuntime'
import { Link } from 'react-router'
import { DetailPageActions } from 'app/modules/common/components/DetailPageActions/DetailPageActions'

const tryDecodeObservationId = Schema.decodeOption(ObservationId)

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const observationIdMaybe = tryDecodeObservationId(params.observationId)

  const observation = await runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* ObservationRepository

      const observationId = yield* observationIdMaybe.pipe(
        Option.map(Effect.succeed),
        Option.getOrElse(() =>
          Effect.fail(new UnhandledError({ cause: 'Observation ID not found' }))
        )
      )

      return yield* repository.get(observationId)
    })
  )

  return { observation }
}

function renderObservationValue(
  observation:
    | undefined
    | NonNullable<Observation['component']>[number]
    | Observation
): React.ReactNode {
  if (!observation) return <></>

  if ('valueQuantity' in observation && observation.valueQuantity) {
    return <div>{observation.valueQuantity.value || ''}</div>
  }

  if (
    'valueCodeableConcept' in observation &&
    observation.valueCodeableConcept
  ) {
    return (
      <div>
        {observation.valueCodeableConcept.text ||
          observation.valueCodeableConcept.coding?.[0]?.display ||
          'Coded value'}
      </div>
    )
  }

  if ('valueString' in observation && observation.valueString) {
    return <div>{observation.valueString}</div>
  }

  if ('valueBoolean' in observation && observation.valueBoolean !== undefined) {
    return <div>{observation.valueBoolean ? 'True' : 'False'}</div>
  }

  if ('valueInteger' in observation && observation.valueInteger !== undefined) {
    return <div>{observation.valueInteger}</div>
  }

  if ('valueDecimal' in observation && observation.valueDecimal !== undefined) {
    return <div>{observation.valueDecimal}</div>
  }

  if ('valueDateTime' in observation && observation.valueDateTime) {
    return (
      <div>
        {new Date(observation.valueDateTime.epochMillis).toLocaleString()}
      </div>
    )
  }

  if ('valueDate' in observation && observation.valueDate) {
    return <div>{observation.valueDate}</div>
  }

  if ('valueTime' in observation && observation.valueTime) {
    return <div>{observation.valueTime}</div>
  }

  if ('valueCoding' in observation && observation.valueCoding) {
    return (
      <div>
        {observation.valueCoding.display ||
          observation.valueCoding.code ||
          'Coded value'}
      </div>
    )
  }

  if ('valueCode' in observation && observation.valueCode) {
    return <div>{observation.valueCode}</div>
  }

  if ('valueUrl' in observation && observation.valueUrl) {
    return <div>{observation.valueUrl}</div>
  }

  if ('valueCanonical' in observation && observation.valueCanonical) {
    return <div>{observation.valueCanonical}</div>
  }

  if ('valueReference' in observation && observation.valueReference) {
    return (
      <div>
        {observation.valueReference.display ||
          observation.valueReference.reference ||
          'Reference'}
      </div>
    )
  }

  if ('dataAbsentReason' in observation && observation.dataAbsentReason) {
    return (
      <div style={{ color: 'var(--color-text-secondary)' }}>
        Data absent:{' '}
        {observation.dataAbsentReason.text || 'Reason not specified'}
      </div>
    )
  }

  return (
    <div style={{ color: 'var(--color-text-secondary)' }}>
      No value recorded
    </div>
  )
}

export default function ObservationDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { observation } = loaderData

  const displayName =
    observation.code.text ||
    observation.code.coding?.[0]?.display ||
    'Unknown Observation'

  const effectiveDate = observation.effectiveDateTime
    ? new Date(observation.effectiveDateTime.epochMillis).toLocaleString()
    : observation.effectivePeriod?.start
      ? new Date(
          observation.effectivePeriod.start.epochMillis
        ).toLocaleDateString() +
        (observation.effectivePeriod.end
          ? ' - ' +
            new Date(
              observation.effectivePeriod.end.epochMillis
            ).toLocaleDateString()
          : ' - ongoing')
      : 'Unknown'

  const issuedDate = observation.issued
    ? new Date(observation.issued.epochMillis).toLocaleString()
    : null

  const subjectRef = observation.subject?.reference
  const encounterRef = observation.encounter?.reference

  return (
    <>
      <DetailPageActions
        backTo="/Observation"
        editTo={`/Observation/${observation.id}/edit`}
      />

      <h1 className="heading-1">{displayName}</h1>
      <p className="subheading-3">{observation.id}</p>

      {/* Status & Timing Section */}
      <section style={{ marginTop: 'var(--space-5)' }}>
        <h2 className="heading-3">Status & Timing</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-3)',
          }}
        >
          <span className="body-3">Status:</span>
          <span className="body-3">{observation.status}</span>

          <span className="body-3">Effective:</span>
          <span className="body-3">{effectiveDate}</span>

          {issuedDate && (
            <>
              <span className="body-3">Issued:</span>
              <span className="body-3">{issuedDate}</span>
            </>
          )}

          {observation.category && observation.category.length > 0 && (
            <>
              <span className="body-3">Category:</span>
              <span className="body-3">
                {observation.category
                  .map(
                    (cat) => cat.text || cat.coding?.[0]?.display || 'Unknown'
                  )
                  .join(', ')}
              </span>
            </>
          )}
        </div>
      </section>

      {/* Value Section */}
      <section style={{ marginTop: 'var(--space-5)' }}>
        <h2 className="heading-3">Value</h2>
        <div style={{ marginTop: 'var(--space-3)' }}>
          {renderObservationValue(observation)}
        </div>
      </section>

      {/* References Section */}
      <section style={{ marginTop: 'var(--space-5)' }}>
        <h2 className="heading-3">References</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-3)',
          }}
        >
          <span className="body-3">Subject (Patient):</span>
          <span className="body-3">
            {subjectRef ? (
              <Link to={`/${subjectRef}`}>
                {observation.subject?.display || subjectRef}
              </Link>
            ) : (
              <span style={{ color: 'var(--color-text-secondary)' }}>
                No patient linked
              </span>
            )}
          </span>

          <span className="body-3">Encounter:</span>
          <span className="body-3">
            {encounterRef ? (
              <Link to={`/${encounterRef}`}>
                {observation.encounter?.display || encounterRef}
              </Link>
            ) : (
              <span style={{ color: 'var(--color-text-secondary)' }}>
                No encounter linked
              </span>
            )}
          </span>

          {observation.performer && observation.performer.length > 0 && (
            <>
              <span className="body-3">Performer(s):</span>
              <span className="body-3">
                {observation.performer
                  .map((p) => p.display || p.reference || 'Unknown')
                  .join(', ')}
              </span>
            </>
          )}
        </div>
      </section>

      {/* Interpretation Section */}
      {((observation.interpretation && observation.interpretation.length > 0) ||
        (observation.referenceRange &&
          observation.referenceRange.length > 0)) && (
        <section style={{ marginTop: 'var(--space-5)' }}>
          <h2 className="heading-3">Interpretation & Reference Range</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-3)',
            }}
          >
            {observation.interpretation &&
              observation.interpretation.length > 0 && (
                <>
                  <span className="body-3">Interpretation:</span>
                  <span className="body-3">
                    {observation.interpretation
                      .map(
                        (interp) =>
                          interp.text ||
                          interp.coding?.[0]?.display ||
                          'Unknown'
                      )
                      .join(', ')}
                  </span>
                </>
              )}

            {observation.referenceRange &&
              observation.referenceRange.length > 0 && (
                <>
                  <span className="body-3">Reference Range:</span>
                  <div className="body-3">
                    {observation.referenceRange.map((range, i) => (
                      <div key={i} style={{ marginBottom: 'var(--space-2)' }}>
                        {range.low && (
                          <span>
                            Low: {range.low.value} {range.low.unit || ''}
                          </span>
                        )}
                        {range.low && range.high && ' • '}
                        {range.high && (
                          <span>
                            High: {range.high.value} {range.high.unit || ''}
                          </span>
                        )}
                        {range.text && <div>{range.text}</div>}
                      </div>
                    ))}
                  </div>
                </>
              )}
          </div>
        </section>
      )}

      {/* Components Section */}
      {observation.component && observation.component.length > 0 && (
        <section style={{ marginTop: 'var(--space-5)' }}>
          <h2 className="heading-3">Components</h2>
          <div style={{ marginTop: 'var(--space-3)' }}>
            {observation.component.map((comp, i) => (
              <div
                key={i}
                style={{
                  padding: 'var(--space-3)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <strong>
                  {comp.code.text ||
                    comp.code.coding?.[0]?.display ||
                    'Component'}
                </strong>
                <div>{renderObservationValue(comp)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Additional Details Section */}
      {(observation.method ||
        observation.bodySite ||
        observation.device ||
        observation.specimen ||
        (observation.note && observation.note.length > 0)) && (
        <section style={{ marginTop: 'var(--space-5)' }}>
          <h2 className="heading-3">Additional Details</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-3)',
            }}
          >
            {observation.method && (
              <>
                <span className="body-3">Method:</span>
                <span className="body-3">
                  {observation.method.text ||
                    observation.method.coding?.[0]?.display ||
                    'Unknown'}
                </span>
              </>
            )}

            {observation.bodySite && (
              <>
                <span className="body-3">Body Site:</span>
                <span className="body-3">
                  {observation.bodySite.text ||
                    observation.bodySite.coding?.[0]?.display ||
                    'Unknown'}
                </span>
              </>
            )}

            {observation.device?.reference && (
              <>
                <span className="body-3">Device:</span>
                <span className="body-3">
                  {observation.device.display || observation.device.reference}
                </span>
              </>
            )}

            {observation.specimen?.reference && (
              <>
                <span className="body-3">Specimen:</span>
                <span className="body-3">
                  {observation.specimen.display ||
                    observation.specimen.reference}
                </span>
              </>
            )}

            {observation.note && observation.note.length > 0 && (
              <>
                <span className="body-3">Notes:</span>
                <div className="body-3">
                  {observation.note.map((note, i) => (
                    <div key={i} style={{ marginBottom: 'var(--space-2)' }}>
                      {note.text}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Raw Data */}
      <details style={{ marginTop: 'var(--space-7)' }}>
        <summary className="heading-3" style={{ cursor: 'pointer' }}>
          Raw Data
        </summary>
        <pre
          style={{
            marginTop: 'var(--space-3)',
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-2)',
            overflow: 'auto',
          }}
        >
          {JSON.stringify(observation, null, 2)}
        </pre>
      </details>
    </>
  )
}
