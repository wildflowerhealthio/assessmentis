import { Link } from 'react-router'

interface DetailPageActionsProps {
  backTo: string
  editTo?: string
  backLabel?: string
}

export function DetailPageActions({
  backTo,
  editTo,
  backLabel = '← Back',
}: DetailPageActionsProps) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
      <Link to={backTo} className="button-3 ghost">
        {backLabel}
      </Link>
      {editTo && (
        <Link to={editTo} className="button-2 blue">
          Edit
        </Link>
      )}
    </div>
  )
}
