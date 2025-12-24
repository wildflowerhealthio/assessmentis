import { Link } from 'react-router'
import {
  Composition,
  CompositionId,
} from '@assessmentis/clinical-domain/content-management'

const CompositionList = ({
  compositions,
  deleteComposition,
}: {
  compositions: { data: Composition; loading: boolean }[]
  deleteComposition: (id: CompositionId | undefined) => Promise<unknown>
}) => (
  <ul>
    {compositions.map(({ data, loading }, index) => {
      const { id, title, status, date } = data
      const key = id ?? `${title ?? 'composition'}-${index}`

      return (
        <li
          key={key}
          className="body-3"
          style={loading ? { color: 'rgba(0,0,0,0.5)' } : {}}
        >
          <button
            onClick={() => deleteComposition(id)}
            style={{ border: 'none', display: 'inline' }}
            disabled={!id}
          >
            ❌
          </button>
          {id ? (
            <Link to={`/Composition/${id}`} style={{ display: 'inline' }}>
              {title ?? id}
            </Link>
          ) : (
            <span>{title ?? 'Untitled composition'}</span>
          )}
          <span
            className="subheading-3"
            style={{ marginLeft: 'var(--space-2)' }}
          >
            {status ?? 'status unknown'}
            {date ? ` • ${date}` : ''}
          </span>
        </li>
      )
    })}
  </ul>
)

export default CompositionList
