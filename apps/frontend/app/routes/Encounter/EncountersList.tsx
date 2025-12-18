import {
  Encounter,
  type EncounterId,
} from '@assessmentis/clinical-domain/administration'
import { Link } from 'react-router'

const EncountersList = ({
  encounters,
  deleteEncounter,
}: {
  encounters: { data: Encounter; loading: boolean }[]
  deleteEncounter: (id: EncounterId | undefined) => Promise<void>
}) => (
  <ul>
    {encounters.map(({ data: { id }, loading }) => (
      <li
        key={id}
        className="body-3"
        style={loading ? { color: 'rgba(0,0,0,0.5)' } : {}}
      >
        <button
          onClick={() => deleteEncounter(id)}
          style={{ border: 'none', display: 'inline' }}
        >
          ❌
        </button>
        <Link key={id} to={`/Encounter/${id}`} style={{ display: 'inline' }}>
          {id}
        </Link>
      </li>
    ))}
  </ul>
)

export default EncountersList
