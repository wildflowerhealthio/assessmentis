import { Effect, Option, Schema } from 'effect'
import {
  PatientId,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/Patient.$patientId'
import { getRuntime } from '../clientRuntime'
import { Link } from 'react-router'
import { PractitionerPicker } from 'app/modules/common/components/BasePicker'
import { ResourceForm } from 'app/modules/common/components/ResourceForm'
import { useRuntimeContext } from 'app/clientRuntime'
import { applyPartialProps, transformProps } from '@assessmentis/react-util'
import { CommonFieldProps } from '../modules/common/components/ResourceForm/ResourceForm'

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

const PractitionerUpdateSchema = Schema.Struct({
  practitionerId: Schema.optional(Schema.String),
})

export default function PatientDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { patient } = loaderData
  const clientRuntime = useRuntimeContext()

  const displayName = patient.name?.[0]
    ? `${patient.name[0].given?.join(' ') ?? ''} ${patient.name[0].family ?? ''}`.trim()
    : 'Unnamed Patient'

  const currentPractitionerId =
    patient.generalPractitioner?.[0]?.reference?.split('/')[1]

  const handleUpdatePractitioner = async (
    formData: typeof PractitionerUpdateSchema.Type
  ) => {
    await clientRuntime.runPromise(
      Effect.gen(function* () {
        const repository = yield* PatientRepository

        if (!patient.id) {
          yield* Effect.fail(
            new UnhandledError({ cause: 'Patient ID missing' })
          )
        }

        return yield* repository.update({
          ...patient,
          id: patient.id,
          generalPractitioner: formData.practitionerId
            ? [{ reference: `Practitioner/${formData.practitionerId}` }]
            : undefined,
        })
      })
    )

    // Reload the page to show updated data
    window.location.reload()
  }

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

      {/* Edit General Practitioner Section */}
      <section style={{ marginTop: 'var(--space-5)' }}>
        <h2 className="heading-3">General Practitioner</h2>
        <ResourceForm
          schema={PractitionerUpdateSchema}
          fields={{
            practitionerId: transformProps(
              PractitionerPicker,
              (props: CommonFieldProps<string | undefined>) => ({
                name: 'practitionerId',
                label: 'General Practitioner',
                picking: {
                  onChange: props.onChange,
                  value: props.value,
                  multiple: false as const,
                },
              })
            ),
          }}
          fieldOrder={['practitionerId']}
          initialValues={{
            practitionerId: currentPractitionerId,
          }}
          onSubmit={handleUpdatePractitioner}
          submitLabel="Save Changes"
        />
      </section>

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
