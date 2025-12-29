import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Link } from 'react-router'
import classes from './ResourceItemActions.module.css'

interface ResourceItemActionsProps {
  viewPath?: string
  editPath: string
  onDelete: () => void
  disabled?: boolean
}

export function ResourceItemActions({
  viewPath,
  editPath,
  onDelete,
  disabled = false,
}: ResourceItemActionsProps) {
  return (
    <Menu as="div" className={classes.ResourceItemActions}>
      <MenuButton
        disabled={disabled}
        className="button-3 ghost"
        aria-label="Actions"
      >
        Actions
      </MenuButton>

      <MenuItems className={classes.ResourceItemActions__menu}>
        {viewPath ? (
          <MenuItem>
            <Link to={viewPath} className={classes.ResourceItemActions__item}>
              View
            </Link>
          </MenuItem>
        ) : undefined}

        <MenuItem>
          <Link to={editPath} className={classes.ResourceItemActions__item}>
            Edit
          </Link>
        </MenuItem>

        <MenuItem>
          <button
            onClick={onDelete}
            className={`${classes.ResourceItemActions__item} ${classes['ResourceItemActions__item--delete']}`}
          >
            Delete
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  )
}
