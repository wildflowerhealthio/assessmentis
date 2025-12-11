import {
  Layer,
  Effect,
  Stream,
  StreamEmit,
  Chunk,
  Either,
  Schema,
  Option,
  SubscriptionRef,
  Ref,
  Equal,
} from 'effect'
import { Auth, onIdTokenChanged } from 'firebase/auth'
import {
  AuthStateError,
  FrontendConfigDataError,
  OrgSlug,
  PlatformService,
  UserDataError,
} from '@assessmentis/platform-domain'
import { snapshotStream } from './firestore'
import {
  DocumentData,
  doc,
  FirestoreError,
  Firestore,
} from 'firebase/firestore'
import {
  CurrentUserError,
  CurrentUserIdError,
  FrontendConfigError,
  NoOrgSelected,
  NotLoggedIn,
  OrgRole,
  OrgRoleError,
  User,
  UserId,
} from '@assessmentis/platform-domain'
import { FrontendConfig } from '@assessmentis/platform-domain'
import {
  LoadedResult,
  LoadedResultStream,
} from '@assessmentis/util/LoadedResult'
import { createRuntime } from './RuntimeProvider'
import { FirebaseApp } from 'firebase/app'

export const FirebaseWebPlatformServiceLayer = (
  _app: FirebaseApp,
  auth: Auth,
  db: Firestore
) =>
  Layer.effect(
    PlatformService,
    Effect.gen(function* () {
      console.log('Starting FirebaseWebPlatformServiceLayer')

      // const baseLoadingStream = () =>
      //   LoadedResultStream.succeed<object, never>({})

      const currentUserId = Stream.concat(
        Stream.succeed<LoadedResult<UserId, CurrentUserIdError>>(
          LoadedResult.loading()
        ),
        Stream.async(
          (
            emit: StreamEmit.Emit<
              never,
              never,
              LoadedResult<UserId, CurrentUserIdError>,
              void
            >
          ) => {
            console.log('Setting up auth state listener')
            const unsubscribe = onIdTokenChanged(
              auth,
              (user) => {
                console.log('Got user', user)
                if (user) {
                  emit(
                    Effect.succeed(
                      Chunk.of(
                        LoadedResult.loaded<UserId, never>(
                          UserId.make(user.uid)
                        )
                      )
                    )
                  )
                } else {
                  emit(
                    Effect.succeed(
                      Chunk.of(
                        LoadedResult.error<never, NotLoggedIn>(
                          NotLoggedIn.make({})
                        )
                      )
                    )
                  )
                }
              },
              (cause) => {
                emit(
                  Effect.succeed(
                    Chunk.of(
                      LoadedResult.error<never, AuthStateError>(
                        AuthStateError.make({ cause })
                      )
                    )
                  )
                )
              }
            )
            return Effect.sync(() => {
              console.log('Unsubscribing from auth state listener')
              unsubscribe()
            })
          }
        )
      )

      const currentUser = currentUserId.pipe(
        LoadedResultStream.andThen((userId) =>
          snapshotStream(doc(db, 'users', userId)).pipe(
            Stream.flatMap((documentData: DocumentData) =>
              Schema.decodeUnknownEither(User)(documentData.value).pipe(
                Either.match({
                  onLeft: (cause) => Stream.fail(UserDataError.make({ cause })),
                  onRight: (user) => Stream.succeed(user),
                })
              )
            ),
            Stream.mapError(
              (cause): CurrentUserError =>
                cause instanceof FirestoreError || typeof cause === 'string'
                  ? UserDataError.make({ cause })
                  : cause
            )
          )
        )
      )

      const orgSlugRef = yield* SubscriptionRef.make<Option.Option<OrgSlug>>(
        Option.none()
      )

      const orgRole = Stream.zipLatest(currentUser, orgSlugRef.changes).pipe(
        Stream.mapEffect(
          ([userEither, orgSlugOpt]): Effect.Effect<
            LoadedResult<OrgRole, OrgRoleError>,
            never
          > => {
            if (userEither._tag === 'loaded') {
              const orgs = Object.keys(userEither.value.org_roles)
              if (orgs.length === 1) {
                const orgSlug = OrgSlug.make(orgs[0])
                const alreadySet = Equal.equals(
                  orgSlugOpt,
                  Option.some(orgSlug)
                )
                if (!alreadySet) {
                  return Ref.set(orgSlugRef, Option.some(orgSlug)).pipe(
                    Effect.map(() =>
                      LoadedResult.loaded(
                        OrgRole.make({
                          orgSlug: orgSlug,
                          roles: userEither.value.org_roles[orgSlug],
                        })
                      )
                    )
                  )
                }
              } else {
                const orgInvalid = orgSlugOpt.pipe(
                  Option.match({
                    onSome: (org) => orgs.includes(org),
                    onNone: () => false,
                  })
                )
                if (orgInvalid && !Option.isNone(orgSlugOpt)) {
                  return Ref.set(orgSlugRef, Option.none()).pipe(
                    Effect.map(() => LoadedResult.error(NoOrgSelected.make({})))
                  )
                }
              }
              return Ref.get(orgSlugRef).pipe(
                Effect.map((orgSlug) =>
                  orgSlug.pipe(
                    Option.match({
                      onNone: () => LoadedResult.error(NoOrgSelected.make({})),
                      onSome: (orgSlug) =>
                        LoadedResult.loaded(
                          OrgRole.make({
                            orgSlug: orgSlug,
                            roles: userEither.value.org_roles[orgSlug],
                          })
                        ),
                    })
                  )
                )
              )
            } else {
              return Effect.succeed(userEither)
            }
          }
        )
        // Stream.map(
        //   ([userResult, orgSlugOpt]): LoadedResult<OrgRole, OrgRoleError> => {
        //     if (userResult._tag != 'loaded') return userResult

        //     const org = orgSlugOpt.pipe(Option.getOrElse(() => undefined))
        //     if (!org) return LoadedResult.error(NoOrgSelected.make({}))

        //     const roles = userResult.value.org_roles[org]
        //     if (!roles) return LoadedResult.error(NoOrgSelected.make({}))

        //     return LoadedResult.loaded(OrgRole.make({ orgSlug: org, roles }))
        //   }
        // )
      )

      const frontendConfig = orgRole.pipe(
        LoadedResultStream.andThen((orgRole) =>
          snapshotStream(doc(db, 'orgs', orgRole.orgSlug)).pipe(
            Stream.flatMap(
              (
                documentData: DocumentData
              ): Stream.Stream<FrontendConfig, FrontendConfigError> =>
                Schema.decodeUnknownEither(FrontendConfig)(
                  documentData.value.frontendConfig
                ).pipe(
                  Either.match({
                    onLeft: (cause) =>
                      Stream.fail<FrontendConfigError>(
                        FrontendConfigDataError.make({ cause })
                      ),
                    onRight: (config) => Stream.succeed(config),
                  })
                )
            ),
            Stream.mapError(
              (cause): FrontendConfigError =>
                cause instanceof FirestoreError || typeof cause === 'string'
                  ? UserDataError.make({ cause })
                  : cause
            )
          )
        )
      )

      const runtime = frontendConfig.pipe(
        LoadedResultStream.map((config) => createRuntime(config))
      )

      return {
        currentUserId,
        currentUser,
        orgRole,
        frontendConfig,
        runtime,
      }
    })
  )
