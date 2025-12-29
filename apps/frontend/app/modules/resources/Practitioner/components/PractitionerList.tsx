import { Link } from 'react-router'
import type {
  Practitioner,
  PractitionerId,
} from '@assessmentis/clinical-domain/administration'

const PractitionerList = ({
  practitioners,
  deletePractitioner,
}: {
  practitioners: { data: Practitioner; loading: boolean }[]
  deletePractitioner: (id: PractitionerId | undefined) => Promise<void>
}) => {
  return (
    <div>
      <h2 className="heading-3">Practitioner List</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {practitioners.map(({ data: practitioner, loading }, index) => {
          const displayName = practitioner.name?.[0]
            ? `${practitioner.name[0].given?.join(' ') ?? ''} ${practitioner.name[0].family ?? ''}`.trim()
            : 'Unnamed Practitioner'

          const qualification =
            practitioner.qualification?.[0]?.code?.text ??
            practitioner.qualification?.[0]?.code?.coding?.[0]?.display ??
            'No qualification'

          return (
            <li
              key={practitioner.id ?? index}
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
                className="element-button button-3 ghost"
                onClick={() => deletePractitioner(practitioner.id)}
                disabled={loading}
                aria-label="Delete practitioner"
                style={{ border: 'none' }}
              >
                ❌
              </button>
              <Link
                to={`/Practitioner/${practitioner.id}`}
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
                  {practitioner.gender ?? 'Unknown gender'} • {qualification}
                  {practitioner.active === false && ' • Inactive'}
                </div>
              </Link>
            </li>
          )
        })}
        {practitioners.length === 0 && (
          <li
            className="body-3"
            style={{
              padding: 'var(--space-3)',
              color: 'var(--color-text-secondary)',
            }}
          >
            No practitioners found.
          </li>
        )}
      </ul>
    </div>
  )
}

export default PractitionerList
