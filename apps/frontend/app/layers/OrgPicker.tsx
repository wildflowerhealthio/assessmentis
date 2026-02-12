import { cn } from '@assessmentis/react-util'
import { Effect, Option } from 'effect'
import React, { useCallback } from 'react'
import type { Org, User } from '@assessmentis/platform-domain'
import { OrgSlug } from '@assessmentis/platform-domain'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import classes from './OrgPicker.module.css'

export const OrgPicker = ({
  maybeActiveOrg,
  user,
  setActiveOrgSlug,
}: {
  maybeActiveOrg: Option.Option<Org>
  user: User
  setActiveOrgSlug: (
    maybeOrgSlug: Option.Option<OrgSlug>
  ) => Effect.Effect<void, never, never>
}) => {
  const setPickedOrg = useCallback(
    (slug: string | null) => {
      const optionalSlug = Option.fromNullable(slug).pipe(
        Option.map(OrgSlug.make)
      )
      Effect.runPromise(setActiveOrgSlug(optionalSlug)).catch((e) => {
        console.error('Error setting active org:', e)
      })
    },
    [setActiveOrgSlug]
  )

  const orgSlugs = Object.keys(user.org_roles)

  const label = Option.match(maybeActiveOrg, {
    onSome({ emoji }) {
      return emoji
    },
    onNone() {
      return 'Select an Organization'
    },
  })

  return (
    <Menu>
      <div className={classes.OrgPicker}>
        <MenuButton
          style={Option.isSome(maybeActiveOrg) ? {} : { width: 'unset' }}
          className={cn(
            'element-button button-1 ghost',
            classes.OrgPicker__button
          )}
        >
          {label}
        </MenuButton>
        <MenuItems className={classes.OrgPicker__menu}>
          {orgSlugs.map((orgSlug) => (
            <MenuItem key={orgSlug}>
              <button
                className={cn('heading-2', classes.OrgPicker__link)}
                onClick={() => setPickedOrg(orgSlug)}
              >
                {orgSlug}
              </button>
            </MenuItem>
          ))}
        </MenuItems>
      </div>
    </Menu>
  )
}
