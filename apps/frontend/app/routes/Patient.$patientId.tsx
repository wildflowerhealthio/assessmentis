import { Effect, Option, Schema } from 'effect'
import {
  PatientId,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/Patient.$patientId'
import { getRuntime } from '../clientRuntime'
import { Link } from 'react-router'

const tryDecodePatientId = Schema.decodeOption(PatientId)

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const patientIdMaybe = tryDecodePatientId(params.patientId)

  const patient = await runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* PatientRepository

      const patientId = yield* patientIdMaybe.pipe(
        Option.map(Effect.succeed),
        Option.getOrElse(() =>
          Effect.fail(new UnhandledError({ cause: 'Patient ID not found' }))
        )
      )

      return yield* repository.get(patientId)
    })
  )

  return { patient }
}

export default function PatientDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { patient } = loaderData

  const displayName = patient.name?.[0]
    ? `${patient.name[0].given?.join(' ') ?? ''} ${patient.name[0].family ?? ''}`.trim()
    : 'Unnamed Patient'

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <Link to="/Patient" className="button-3 ghost">
        ← Back to Patients
      </Link>

      <h1 className="heading-1" style={{ marginTop: 'var(--space-4)' }}>
        {displayName}
      </h1>

      <div
        className="subheading-3"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Patient ID: {patient.id}
      </div>

      {/* Demographics Section */}
      <section style={{ marginTop: 'var(--space-5)' }}>
        <h2 className="heading-3">Demographics</h2>
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: '150px 1fr',
            gap: 'var(--space-2)',
          }}
        >
          <dt>
            <strong>Gender:</strong>
          </dt>
          <dd>{patient.gender ?? 'Not specified'}</dd>

          <dt>
            <strong>Birth Date:</strong>
          </dt>
          <dd>
            {patient.birthDate
              ? new Date(patient.birthDate).toLocaleDateString()
              : 'Not specified'}
          </dd>

          <dt>
            <strong>Status:</strong>
          </dt>
          <dd>{patient.active !== false ? 'Active' : 'Inactive'}</dd>

          {patient.deceasedBoolean && (
            <>
              <dt>
                <strong>Deceased:</strong>
              </dt>
              <dd>Yes</dd>
            </>
          )}

          {patient.deceasedDateTime && (
            <>
              <dt>
                <strong>Deceased Date:</strong>
              </dt>
              <dd>
                {new Date(
                  patient.deceasedDateTime.epochMillis
                ).toLocaleString()}
              </dd>
            </>
          )}
        </dl>
      </section>

      {/* Contact Information */}
      {patient.telecom && patient.telecom.length > 0 && (
        <section style={{ marginTop: 'var(--space-5)' }}>
          <h2 className="heading-3">Contact Information</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {patient.telecom.map((contact, i) => (
              <li key={i}>
                {contact.system}: {contact.value}{' '}
                {contact.use && `(${contact.use})`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Address */}
      {patient.address && patient.address.length > 0 && (
        <section style={{ marginTop: 'var(--space-5)' }}>
          <h2 className="heading-3">Addresses</h2>
          {patient.address.map((addr, i) => (
            <div key={i} style={{ marginBottom: 'var(--space-3)' }}>
              {addr.text || (
                <>
                  {addr.line?.join(', ')}
                  {addr.city && `, ${addr.city}`}
                  {addr.state && `, ${addr.state}`}
                  {addr.postalCode && ` ${addr.postalCode}`}
                  {addr.country && `, ${addr.country}`}
                </>
              )}
              {addr.use && ` (${addr.use})`}
            </div>
          ))}
        </section>
      )}

      {/* Raw Data (for debugging) */}
      <details style={{ marginTop: 'var(--space-5)' }}>
        <summary className="heading-3">Raw Data</summary>
        <pre
          style={{
            background: 'var(--color-background-secondary)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-2)',
            overflow: 'auto',
          }}
        >
          {JSON.stringify(patient, null, 2)}
        </pre>
      </details>
    </div>
  )
}
