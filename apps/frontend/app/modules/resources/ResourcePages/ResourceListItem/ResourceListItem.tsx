import { Link } from 'react-router'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import classes from './ResourceListItem.module.css'

interface ResourceListItemProps {
  displayName: string
  summaryItems: readonly string[]
  viewPath: string
  editPath: string
  onDelete: () => void
  loading: boolean
}

export function ResourceListItem({
  displayName,
  summaryItems,
  viewPath,
  editPath,
  onDelete,
  loading,
}: ResourceListItemProps) {
  return (
    <>
      <Link to={viewPath} className={classes.content}>
        <strong>{displayName}</strong>
        <span className={classes.metadata}>
          {summaryItems.join(' \u2022 ') || '-'}
        </span>
      </Link>
      <ResourceItemActions
        viewPath={viewPath}
        editPath={editPath}
        onDelete={onDelete}
        disabled={loading}
      />
    </>
  )
}

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
        className="element-button button-3 ghost"
        aria-label="Actions"
      >
        Actions
      </MenuButton>

      <MenuItems
        className={classes.ResourceItemActions__menu}
        data-testid="ResourceItemActions__menu"
      >
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
