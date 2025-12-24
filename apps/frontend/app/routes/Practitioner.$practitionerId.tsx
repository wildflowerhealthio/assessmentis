import { Effect, Option, Schema } from 'effect'
import {
  PractitionerId,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/Practitioner.$practitionerId'
import { getRuntime } from '../clientRuntime'
import { Link } from 'react-router'

const tryDecodePractitionerId = Schema.decodeOption(PractitionerId)

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const practitionerIdMaybe = tryDecodePractitionerId(params.practitionerId)

  const practitioner = await runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* PractitionerRepository

      const practitionerId = yield* practitionerIdMaybe.pipe(
        Option.map(Effect.succeed),
        Option.getOrElse(() =>
          Effect.fail(
            new UnhandledError({ cause: 'Practitioner ID not found' })
          )
        )
      )

      return yield* repository.get(practitionerId)
    })
  )

  return { practitioner }
}

export default function PractitionerDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { practitioner } = loaderData

  const displayName = practitioner.name?.[0]
    ? `${practitioner.name[0].given?.join(' ') ?? ''} ${practitioner.name[0].family ?? ''}`.trim()
    : 'Unnamed Practitioner'

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <Link to="/Practitioner" className="button-3 ghost">
        ← Back to Practitioners
      </Link>

      <h1 className="heading-1" style={{ marginTop: 'var(--space-4)' }}>
        {displayName}
      </h1>

      <div
        className="subheading-3"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Practitioner ID: {practitioner.id}
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
          <dd>{practitioner.gender ?? 'Not specified'}</dd>

          <dt>
            <strong>Birth Date:</strong>
          </dt>
          <dd>
            {practitioner.birthDate
              ? new Date(practitioner.birthDate).toLocaleDateString()
              : 'Not specified'}
          </dd>

          <dt>
            <strong>Status:</strong>
          </dt>
          <dd>{practitioner.active !== false ? 'Active' : 'Inactive'}</dd>
        </dl>
      </section>

      {/* Qualifications Section */}
      {practitioner.qualification && practitioner.qualification.length > 0 && (
        <section style={{ marginTop: 'var(--space-5)' }}>
          <h2 className="heading-3">Qualifications</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: 'var(--space-5)' }}>
            {practitioner.qualification.map((qual, i) => (
              <li key={i} style={{ marginBottom: 'var(--space-2)' }}>
                <strong>
                  {qual.code.text ??
                    qual.code.coding?.[0]?.display ??
                    'Unknown qualification'}
                </strong>
                {qual.period && (
                  <div
                    style={{
                      fontSize: '0.9em',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Period:{' '}
                    {qual.period.start
                      ? new Date(
                          qual.period.start.epochMillis
                        ).toLocaleDateString()
                      : 'Unknown'}
                    {' - '}
                    {qual.period.end
                      ? new Date(
                          qual.period.end.epochMillis
                        ).toLocaleDateString()
                      : 'Present'}
                  </div>
                )}
                {qual.issuer && (
                  <div
                    style={{
                      fontSize: '0.9em',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Issuer: {qual.issuer.display ?? qual.issuer.reference}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Contact Information */}
      {practitioner.telecom && practitioner.telecom.length > 0 && (
        <section style={{ marginTop: 'var(--space-5)' }}>
          <h2 className="heading-3">Contact Information</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {practitioner.telecom.map((contact, i) => (
              <li key={i}>
                {contact.system}: {contact.value}{' '}
                {contact.use && `(${contact.use})`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Address */}
      {practitioner.address && practitioner.address.length > 0 && (
        <section style={{ marginTop: 'var(--space-5)' }}>
          <h2 className="heading-3">Addresses</h2>
          {practitioner.address.map((addr, i) => (
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

      {/* Languages Section */}
      {practitioner.communication && practitioner.communication.length > 0 && (
        <section style={{ marginTop: 'var(--space-5)' }}>
          <h2 className="heading-3">Languages</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {practitioner.communication.map((lang, i) => (
              <li key={i}>
                {lang.text ?? lang.coding?.[0]?.display ?? 'Unknown language'}
              </li>
            ))}
          </ul>
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
          {JSON.stringify(practitioner, null, 2)}
        </pre>
      </details>
    </div>
  )
}
