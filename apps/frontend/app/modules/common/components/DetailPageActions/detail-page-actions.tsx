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
}: DetailPageActionsProps): React.JSX.Element {
  return (
    <div className={classes.DetailPageActions}>
      <Link to={backTo} className="element-button button-3 ghost">
        {backLabel}
      </Link>
      {editTo ? (
        <Link to={editTo} className="element-button button-2 blue filled">
          Edit
        </Link>
      ) : undefined}
    </div>
  )
}
