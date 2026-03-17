import { Either, Option, Stream } from 'effect'
import type { Effect, Scope } from 'effect'
import React, { Suspense, useMemo } from 'react'
import { Await } from 'react-router'

import {
  AuthError,
  BadDataError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { NoSelectedOrgError } from '@assessmentis/platform-domain'
import type { Org, OrgSlug, User, UserId } from '@assessmentis/platform-domain'
import { useStream } from '@assessmentis/react-util'
import { StreamEither } from '@assessmentis/util'

import { cn } from '../../../../../../../global/react-util/src/functions'
import { signIn } from '../../../../firebase'
import { OrgPicker } from '../../../../layers/OrgPicker'
import { HeaderBreadcrumbs } from './HeaderBreadcrumbs'
import { NavBurger } from './NavBurger'
import classes from './NavHeader.module.css'
import { OptionalBackButton } from './OptionalBackButton'

interface NavHeaderProps {
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
      | UnhandledError
      | AuthError
      | BadDataError
      | NotFoundError<'User', { userId: UserId }>
    >,
    never,
    Scope.Scope
  >
  setActiveOrgSlug: (
    maybeOrgSlug: Option.Option<OrgSlug>
  ) => Effect.Effect<void, never, never>
}

const NavHeaderContainer = ({
  userStream,
  activeOrgStream,
  setActiveOrgSlug,
}: NavHeaderProps) => {
  const jsxStream = useMemo(() => {
    const optionalOrgStream: Stream.Stream<
      Either.Either<
        Option.Option<Org>,
        | AuthError
        | UnhandledError
        | BadDataError
        | NotFoundError<'Org', { orgSlug: OrgSlug }>
      >,
      never,
      Scope.Scope
    > = activeOrgStream.pipe(
      Stream.map(
        Either.match({
          onRight(right) {
            return Either.right(Option.some(right))
          },
          onLeft(left) {
            if (left instanceof NoSelectedOrgError) {
              return Either.right(Option.none<Org>())
            }
            return Either.left(left)
          },
        })
      )
    )

    return StreamEither.zipLatestWith(
      userStream,
      optionalOrgStream,
      (user, maybeActiveOrg) => {
        return (
          <OrgPickerHeader
            user={user}
            maybeActiveOrg={maybeActiveOrg}
            setActiveOrgSlug={setActiveOrgSlug}
          />
        )
      }
    ).pipe(
      Stream.map(
        Either.match({
          onRight: (jsx) => jsx,
          onLeft: (error) => {
            if (error instanceof AuthError) {
              return <TextHeader title="Please Login" onClick={signIn} />
            } else if (error instanceof BadDataError) {
              return <TextHeader title="Data Error - Contact Support" />
            } else if (
              error instanceof NotFoundError &&
              error.resourceType == 'User'
            ) {
              return <TextHeader title="User not found - Contact Support" />
            } else if (
              error instanceof NotFoundError &&
              error.resourceType == 'Org'
            ) {
              return <TextHeader title="Org not found - Contact Support" />
            } else if (error instanceof UnhandledError) {
              return (
                <TextHeader title="Unhandled Error - Try again, or Contact Support" />
              )
            }

            return (
              <TextHeader title="Unhandled Error - Try again, or Contact Support" />
            )
          },
        })
      )
    )
  }, [activeOrgStream, setActiveOrgSlug, userStream])

  const jsxPromise = useStream(jsxStream)

  return (
    <Suspense fallback={<TextHeader title="Loading Header..." />}>
      <Await resolve={jsxPromise}>{(jsx) => jsx}</Await>
    </Suspense>
  )
}

const OrgPickerHeader = ({
  maybeActiveOrg,
  user,
  setActiveOrgSlug,
}: {
  maybeActiveOrg: Option.Option<Org>
  user: User
  setActiveOrgSlug: (
    slug: Option.Option<OrgSlug>
  ) => Effect.Effect<void, never, never>
}) => (
  <header className={classes.NavHeader}>
    <OptionalBackButton />
    <OrgPicker
      maybeActiveOrg={maybeActiveOrg}
      user={user}
      setActiveOrgSlug={setActiveOrgSlug}
    />
    {Option.match(maybeActiveOrg, {
      onSome(_) {
        return <HeaderBreadcrumbs />
      },
      onNone() {
        return (
          <span
            className={'text-alt-heading-3'}
            style={{ color: 'var(--neutral-1)' }}
          ></span>
        )
      },
    })}

    <NavBurger />
  </header>
)

export const TextHeader = (props: {
  title: React.ReactNode
  onClick?: () => void
}) => {
  const title = props.onClick ? (
    <button
      onClick={props.onClick}
      className={cn(
        'element-button',
        'button-1',
        'ghost',
        'text-alt-heading-3'
      )}
    >
      {' '}
      {props.title}
    </button>
  ) : (
    <span
      className={'text-alt-heading-3'}
      style={{ color: 'var(--neutral-1)' }}
    >
      {props.title}
    </span>
  )

  return (
    <header className={classes.NavHeader}>
      <OptionalBackButton />
      {title}
      <NavBurger />
    </header>
  )
}

export default NavHeaderContainer
