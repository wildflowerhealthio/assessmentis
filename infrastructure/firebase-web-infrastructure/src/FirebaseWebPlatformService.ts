import {
  Layer,
  Effect,
  Either,
  Schema,
  SubscriptionRef,
  Ref,
  pipe,
} from 'effect'
import { Auth, onIdTokenChanged } from 'firebase/auth'
import {
  AuthStateError,
  ClientRuntimeContext,
  Org,
  OrgDataError,
  OrgError,
  UserPlatformService,
  UserDataError,
} from '@assessmentis/platform-domain'
import { doc, Firestore, onSnapshot } from 'firebase/firestore'
import {
  CurrentUserError,
  CurrentUserIdError,
  NotLoggedIn,
  User,
  UserId,
} from '@assessmentis/platform-domain'
import { LoadedResult } from '@assessmentis/ontology'
import { createRuntime } from './RuntimeProvider'
import { FirebaseApp } from 'firebase/app'

export const createUserPlatformService = (
  app: FirebaseApp,
  auth: Auth,
  db: Firestore
): Effect.Effect<typeof UserPlatformService.Service> =>
  Effect.gen(function* () {
    const initGapi = async (token: string) => {
      const apiKey = app.options.apiKey!
      gapi.client.setApiKey(apiKey)
      gapi.client.setToken({ access_token: token })
      await gapi.client.load(
        'https://healthcare.googleapis.com/$discovery/rest?version=v1'
      )
    }

    const currentUserId = yield* SubscriptionRef.make<
      LoadedResult<UserId, CurrentUserIdError>
    >(LoadedResult.loading())

    const currentUser = yield* SubscriptionRef.make<
      LoadedResult<User, CurrentUserError>
    >(LoadedResult.loading())

    const org = yield* SubscriptionRef.make<LoadedResult<Org, OrgError>>(
      LoadedResult.loading()
    )

    const runtime = yield* SubscriptionRef.make<
      LoadedResult<Layer.Layer<ClientRuntimeContext, never>, OrgError>
    >(LoadedResult.loading())

    const orgId =
      typeof window == 'undefined'
        ? 'sandbox'
        : (window.location.hostname.split('.')[0] ?? 'sandbox')

    let unsubscribeOrg: undefined | (() => void) = undefined
    const subscribeOrg = (): undefined | (() => void) =>
      onSnapshot(
        doc(db, 'orgs', orgId),
        async (documentSnapshot) => {
          const data = documentSnapshot.data()
          const loadedResultOrg =
            data == undefined
              ? LoadedResult.error<Org, OrgError>(
                  OrgDataError.make({
                    cause: `could not find org ${orgId}`,
                  })
                )
              : Schema.decodeUnknownEither(Org)(data).pipe(
                  Either.match({
                    onLeft: (cause) =>
                      LoadedResult.error<Org, OrgError>(
                        OrgDataError.make({ cause })
                      ),
                    onRight: (org) => LoadedResult.loaded<Org, OrgError>(org),
                  })
                )
          await Effect.runPromise(
            Effect.gen(function* () {
              yield* Ref.set(org, loadedResultOrg)
              const createdRuntime = pipe(
                loadedResultOrg,
                LoadedResult.map((org) => createRuntime(org.frontendConfig))
              )
              yield* Ref.set(runtime, createdRuntime)
            })
          )
        },
        async (err) => {
          console.error('Error receiving Firestore document snapshot:', err)
          await Effect.runPromise(
            Ref.set(
              currentUser,
              LoadedResult.error<User, CurrentUserError>(
                UserDataError.make({
                  cause: err,
                })
              )
            )
          )
        }
      )

    let unsubscribeUser: undefined | (() => void) = undefined
    const subscribeUser = (
      userId: string | undefined
    ): undefined | (() => void) =>
      userId == undefined
        ? undefined
        : onSnapshot(
            doc(db, 'users', userId),
            async (documentSnapshot) => {
              const data = documentSnapshot.data()
              const loadedResultUser =
                data == undefined
                  ? LoadedResult.error<User, CurrentUserError>(
                      UserDataError.make({
                        cause: `could not find user ${userId}`,
                      })
                    )
                  : Schema.decodeUnknownEither(User)(data).pipe(
                      Either.match({
                        onLeft: (cause) =>
                          LoadedResult.error<User, CurrentUserError>(
                            UserDataError.make({ cause })
                          ),
                        onRight: (user) =>
                          LoadedResult.loaded<User, CurrentUserError>(user),
                      })
                    )
              await Effect.runPromise(Ref.set(currentUser, loadedResultUser))
            },
            async (err) => {
              console.error('Error receiving Firestore document snapshot:', err)
              await Effect.runPromise(
                Ref.set(
                  currentUser,
                  LoadedResult.error<User, CurrentUserError>(
                    UserDataError.make({
                      cause: err,
                    })
                  )
                )
              )
            }
          )
    let authTokenRefreshTimeout: undefined | ReturnType<typeof setTimeout> =
      undefined
    let unsubscribeAccessToken: undefined | (() => void) = undefined
    const subscribeAccessToken = (
      userId: string | undefined
    ): undefined | (() => void) =>
      userId == undefined
        ? undefined
        : onSnapshot(
            doc(db, 'users', userId, 'tokens', 'googleOAuthAccessToken'),
            async (documentSnapshot) => {
              const data = documentSnapshot.data()
              const token =
                data && typeof data.token == 'string' ? data.token : null
              const expiresAt =
                data && 'toDate' in data.expiresAt
                  ? data.expiresAt.toDate()
                  : null
              if (!(token && expiresAt)) {
                console.error(
                  'No access token found for user',
                  userId,
                  data?.expiresAt
                )
                return
              }
              const expiresInMillis = expiresAt?.getTime() - Date.now()
              if (authTokenRefreshTimeout) {
                clearTimeout(authTokenRefreshTimeout)
              }
              authTokenRefreshTimeout = setTimeout(
                async () => {
                  auth.currentUser
                    ?.getIdToken(true)
                    .then(function (idToken) {
                      fetch('/api/refreshGoogleOAuthToken', {
                        method: 'POST',
                        headers: {
                          'Content-type': 'application/json',
                          authorization: 'Bearer ' + idToken,
                        },
                        body: JSON.stringify({}),
                      }).catch(function (error) {
                        console.log('failed to fetch ' + error)
                      })
                    })
                    .catch(function (error) {
                      console.log('couldnt get user token ' + error)
                    })
                },
                expiresInMillis - 5 * 60 * 1000
              ) // Refresh 5 minutes before expiry
              console.log(
                `Got Token it expires at ${expiresAt}, in ${expiresInMillis}`
              )
              if (gapi.client) {
                gapi.client.setToken({ access_token: token })
              } else {
                gapi.load('client', () => initGapi(token))
              }
            },
            async (err) => {
              console.error(
                'Error receiving Firestore document snapshot for user access token:',
                err
              )
            }
          )

    auth.authStateReady().then(() => {
      onIdTokenChanged(
        auth,
        async (user) => {
          const NotLoggedInResult = LoadedResult.error<never, NotLoggedIn>(
            NotLoggedIn.make({})
          )
          await Effect.runPromise(
            user
              ? Ref.set(
                  currentUserId,
                  LoadedResult.loaded<UserId, never>(UserId.make(user.uid))
                )
              : Effect.all([
                  Ref.set(currentUserId, NotLoggedInResult),
                  Ref.set(currentUser, NotLoggedInResult),
                  Ref.set(org, NotLoggedInResult),
                  Ref.set(runtime, NotLoggedInResult),
                ]).pipe(Effect.asVoid)
          )
          unsubscribeUser?.()
          unsubscribeAccessToken?.()
          unsubscribeOrg?.()
          if (user) {
            unsubscribeUser = subscribeUser(user?.uid)
            unsubscribeAccessToken = subscribeAccessToken(user?.uid)
            unsubscribeOrg = subscribeOrg()
          }
        },
        async (cause) => {
          await Effect.runPromise(
            Ref.set(
              currentUserId,
              LoadedResult.error<never, AuthStateError>(
                AuthStateError.make({ cause })
              )
            )
          )
        }
      )
    })

    return {
      currentUserId,
      currentUser,
      org,
      runtime,
    }
  })
