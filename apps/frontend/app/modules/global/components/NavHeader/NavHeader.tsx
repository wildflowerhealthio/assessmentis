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
  return (
    <header className={classes.NavHeader}>
      <OptionalBackButton />
      <OrgPicker {...props} />
      <HeaderBreadcrumbs />
      <NavBurger />
    </header>
  )
}

export default NavHeader
