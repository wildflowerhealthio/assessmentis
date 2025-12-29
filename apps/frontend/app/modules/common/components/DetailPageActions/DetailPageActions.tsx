import { Link } from 'react-router'
import classes from './DetailPageActions.module.css'

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
    <div className={classes.DetailPageActions}>
      <Link to={backTo} className="button-3 ghost">
        {backLabel}
      </Link>
      {editTo ? (
        <Link to={editTo} className="button-2 blue">
          Edit
        </Link>
      ) : undefined}
    </div>
  )
}
