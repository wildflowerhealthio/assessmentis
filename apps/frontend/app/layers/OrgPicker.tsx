import { usePromiseOrDefault, useStream, cn } from '@assessmentis/react-util'
import { pipe, Scope, Stream } from 'effect'
import { Effect, Either, Option } from 'effect'
import React, { useMemo, useCallback } from 'react'
import { NoSelectedOrgError } from '../../../../domain/platform-domain/src/hostedServices'
import { OrgSlug } from '../../../../domain/platform-domain/src/models/IdTypes'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import classes from './OrgPicker.module.css'
import { Org } from '../../../../domain/platform-domain/src/models/Org'
import { User } from '../../../../domain/platform-domain/src/models/User'
import {
  AuthError,
  BadDataError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { UserId } from '@assessmentis/platform-domain'

const ObjBullets = ({ obj }: { obj: object }) => (
  <ul>
    {Object.entries(obj).map(([key, value]) => (
      <li key={key}>
        <em>{key}</em>:{' '}
        {typeof value == 'object' && value !== null ? (
          <ObjBullets obj={value} />
        ) : (
          <pre className={classes.OrgPicker__errorPre}>
            {JSON.stringify(value, null, 2)}{' '}
          </pre>
        )}
      </li>
    ))}
  </ul>
)

const defaultUserOrgs = Either.right([])

export const OrgPicker = ({
  activeOrgStream,
  userStream,
  setActiveOrgSlug,
}: {
  activeOrgStream: Stream.Stream<
    Either.Either<
      Org,
      | NoSelectedOrgError
      | UnhandledError
      | AuthError
      | BadDataError
      | NotFoundError<'Org', { orgSlug: OrgSlug }>
    >,
    never,
    Scope.Scope
  >
  userStream: Stream.Stream<
    Either.Either<
      User,
      | AuthError
      | UnhandledError
      | BadDataError
      | NotFoundError<'User', { userId: UserId }>
    >,
    never,
    Scope.Scope
  >
  setActiveOrgSlug: (
    maybeOrgSlug: Option.Option<OrgSlug>
  ) => Effect.Effect<void, never, never>
}) => {
  const activeOrgPromise = useStream(activeOrgStream)

  const orgOrErr = usePromiseOrDefault(activeOrgPromise, null)

  const userOrgsStream = useMemo(
    () =>
      userStream.pipe(
        Stream.map(
          Either.map((user) =>
            Object.keys(user.org_roles).map((k) => OrgSlug.make(k))
          )
        )
      ),
    [userStream]
  )
  const userOrgsPromise = useStream(userOrgsStream)

  const userOrgsEither = usePromiseOrDefault(userOrgsPromise, defaultUserOrgs)

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

  const org = useMemo(
    () =>
      pipe(
        Option.fromNullable(orgOrErr),
        Option.flatMap(Either.getRight),
        Option.getOrElse(() => ({ slug: '', emoji: '◌' }))
      ),
    [orgOrErr]
  )

  const error = useMemo(
    () =>
      pipe(
        Either.getLeft(userOrgsEither),
        Option.orElse(() =>
          pipe(orgOrErr, Option.fromNullable, Option.flatMap(Either.getLeft))
        ),
        Option.getOrUndefined
      ),
    [userOrgsEither, orgOrErr]
  )

  if (error instanceof AuthError || error instanceof UnhandledError) {
    throw error
  }

  const hasError = error != undefined && !(error instanceof NoSelectedOrgError)

  return (
    <Menu>
      <div className={classes.OrgPicker}>
        <MenuButton
          className={cn(
            'element-button button-1 ghost',
            classes.OrgPicker__button,
            hasError && classes.OrgPicker__buttonWithError
          )}
        >
          {org.emoji}
        </MenuButton>
        <MenuItems className={classes.OrgPicker__menu}>
          {Option.getOrElse(Either.getRight(userOrgsEither), () => []).map(
            (orgSlug) => (
              <MenuItem key={orgSlug}>
                <button
                  className={cn('heading-2', classes.OrgPicker__link)}
                  onClick={() => setPickedOrg(orgSlug)}
                >
                  {orgSlug}
                </button>
              </MenuItem>
            )
          )}
          {hasError && (
            <div className={classes.OrgPicker__errorTooltip}>
              {String(error)} <ObjBullets obj={error} />
            </div>
          )}
        </MenuItems>
      </div>
    </Menu>
  )
}
