import { OrgPicker } from '../../../../layers/OrgPicker'
import { HeaderBreadcrumbs } from './HeaderBreadcrumbs'
import { NavBurger } from './NavBurger'
import { OptionalBackButton } from './OptionalBackButton'
import { Effect, Either, Stream, Scope, Option } from 'effect'
import {
  Org,
  User,
  OrgSlug,
  UserId,
  NoSelectedOrgError,
} from '@assessmentis/platform-domain'
import classes from './NavHeader.module.css'
import {
  AuthError,
  BadDataError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { cn } from '../../../../../../../global/react-util/src/functions'
import React, { PropsWithChildren } from 'react'
import { useAsyncError } from 'react-router'
import { signIn } from '../../../../firebase'

export const EmptyHeader = () => (
  <NavHeader
    activeOrgStream={Stream.never}
    userStream={Stream.never}
    setActiveOrgSlug={() => Effect.void}
  />
)

export const NavHeaderErrorHandler = ({
  error,
  children,
}: PropsWithChildren<{ error: unknown }>) => {
  if (error instanceof AuthError) {
    return <TextHeader title="Please Login" onClick={signIn} />
  } else if (error instanceof BadDataError || error instanceof NotFoundError) {
    return <TextHeader title="Data Error - Contact Support" />
  } else if (error instanceof NoSelectedOrgError) {
    return <TextHeader title={'Please Select an Organization'} />
  } else if (error instanceof UnhandledError) {
    // Keep
  }

  return children
}

const NavHeader = (props: {
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
}) => {
  const error = useAsyncError()

  return (
    <NavHeaderErrorHandler error={error}>
      <header className={classes.NavHeader}>
        <OptionalBackButton />
        <OrgPicker {...props} />
        <HeaderBreadcrumbs />
        <NavBurger />
      </header>
    </NavHeaderErrorHandler>
  )
}

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

export default NavHeader
