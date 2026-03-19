import { Either, Option, Stream } from 'effect'
import type { Effect, Scope } from 'effect'
import React, { Suspense, useMemo } from 'react'
import { Await } from 'react-router'

import { AuthError, DataIntegrityError, NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { NoSelectedOrgError } from '@assessmentis/platform-domain'
import type { Org, OrgSlug, User, UserId } from '@assessmentis/platform-domain'
import { useStream } from '@assessmentis/react-util'
import { StreamEither } from '@assessmentis/util'

import { cn } from '../../../../../../../global/react-util/src/functions'
import { signIn } from '../../../../firebase'
import { OrgPicker } from '../../../../layers/org-picker'
import { HeaderBreadcrumbs } from './header-breadcrumbs'
import { NavBurger } from './nav-burger'
import { OptionalBackButton } from './optional-back-button'
import classes from './NavHeader.module.css'

interface NavHeaderProps {
  activeOrgStream: Stream.Stream<
    Either.Either<
      Org,
      | NoSelectedOrgError
      | UnhandledError
      | AuthError
      | DataIntegrityError
      | NotFoundError<'Org', { orgSlug: OrgSlug }>
    >,
    never,
    Scope.Scope
  >
  userStream: Stream.Stream<
    Either.Either<
      User,
      UnhandledError | AuthError | DataIntegrityError | NotFoundError<'User', { userId: UserId }>
    >,
    never,
    Scope.Scope
  >
  setActiveOrgSlug: (maybeOrgSlug: Option.Option<OrgSlug>) => Effect.Effect<void, never, never>
}

const NavHeaderContainer = ({
  userStream,
  activeOrgStream,
  setActiveOrgSlug,
}: NavHeaderProps): React.JSX.Element => {
  const jsxStream = useMemo(() => {
    const optionalOrgStream: Stream.Stream<
      Either.Either<
        Option.Option<Org>,
        AuthError | UnhandledError | DataIntegrityError | NotFoundError<'Org', { orgSlug: OrgSlug }>
      >,
      never,
      Scope.Scope
    > = activeOrgStream.pipe(
      // oxlint-disable-next-line unicorn/no-array-callback-reference -- false positive: Stream.map is not an array method
      Stream.map((either) =>
        Either.match(either, {
          onLeft(left) {
            if (left instanceof NoSelectedOrgError) {
              return Either.right(Option.none<Org>())
            }
            return Either.left(left)
          },
          onRight(right) {
            // oxlint-disable-next-line unicorn/no-array-callback-reference -- false positive: Option.some is not an array method
            return Either.right(Option.some(right))
          },
        })
      )
    )

    return StreamEither.zipLatestWith(userStream, optionalOrgStream, (user, maybeActiveOrg) => (
      <OrgPickerHeader
        user={user}
        maybeActiveOrg={maybeActiveOrg}
        setActiveOrgSlug={setActiveOrgSlug}
      />
    )).pipe(
      // oxlint-disable-next-line unicorn/no-array-callback-reference -- false positive: Stream.map is not an array method
      Stream.map((either) =>
        Either.match(either, {
          onLeft: (error) => {
            if (error instanceof AuthError) {
              return <TextHeader title="Please Login" onClick={signIn} />
            } else if (error instanceof DataIntegrityError) {
              return <TextHeader title="Data Error - Contact Support" />
            } else if (error instanceof NotFoundError && error.resourceType === 'User') {
              return <TextHeader title="User not found - Contact Support" />
            } else if (error instanceof NotFoundError && error.resourceType === 'Org') {
              return <TextHeader title="Org not found - Contact Support" />
            } else if (error instanceof UnhandledError) {
              return <TextHeader title="Unhandled Error - Try again, or Contact Support" />
            }

            return <TextHeader title="Unhandled Error - Try again, or Contact Support" />
          },
          onRight: (jsx) => jsx,
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
  setActiveOrgSlug: (slug: Option.Option<OrgSlug>) => Effect.Effect<void, never, never>
}): React.JSX.Element => (
  <header className={classes.NavHeader}>
    <OptionalBackButton />
    <OrgPicker maybeActiveOrg={maybeActiveOrg} user={user} setActiveOrgSlug={setActiveOrgSlug} />
    {Option.match(maybeActiveOrg, {
      onNone() {
        return <span className="text-alt-heading-3" style={{ color: 'var(--neutral-1)' }} />
      },
      onSome(_) {
        return <HeaderBreadcrumbs />
      },
    })}

    <NavBurger />
  </header>
)

export const TextHeader = (props: {
  title: React.ReactNode
  onClick?: () => void
}): React.JSX.Element => {
  const title = props.onClick ? (
    <button
      onClick={props.onClick}
      className={cn('element-button', 'button-1', 'ghost', 'text-alt-heading-3')}
    >
      {' '}
      {props.title}
    </button>
  ) : (
    <span className="text-alt-heading-3" style={{ color: 'var(--neutral-1)' }}>
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
