import React, { useCallback, useMemo } from 'react'

import type { Authenticator } from '@firecms/core'
import {
  AppBar,
  CircularProgressCenter,
  Drawer,
  FireCMS,
  ModeControllerProvider,
  NavigationRoutes,
  Scaffold,
  SideDialogs,
  SnackbarProvider,
  useBuildLocalConfigurationPersistence,
  useBuildModeController,
  useBuildNavigationController,
  useValidateAuthenticator,
} from '@firecms/core'
import type {
  FirebaseAuthController,
  FirebaseSignInProvider,
  FirebaseUserWrapper,
} from '@firecms/firebase'
import {
  FirebaseLoginView,
  useFirebaseAuthController,
  useFirebaseStorageSource,
  useFirestoreDelegate,
  useInitialiseFirebase,
} from '@firecms/firebase'

import { orgsCollection } from './collections/orgs'
import { firebaseConfig } from './firebase_config'

function App(): React.JSX.Element {
  // Use your own authentication logic here
  const myAuthenticator: Authenticator<FirebaseUserWrapper> = useCallback(
    async ({ user, authController: _authController }) => {
      if (user?.email?.includes('flanders')) {
        // You can throw an error to prevent access
        throw new Error('Stupid Flanders!')
      }

      const idTokenResult = await user?.firebaseUser?.getIdTokenResult()
      const _userIsAdmin = idTokenResult?.claims.admin ?? user?.email?.endsWith('@firecms.co')

      console.log('Allowing access to', user)

      // We allow access to every user in this case
      return true
    },
    []
  )

  const collections = useMemo(() => [orgsCollection], [])

  const { firebaseApp, firebaseConfigLoading, configError } = useInitialiseFirebase({
    firebaseConfig,
  })

  // Controller used to manage the dark or light color mode
  const modeController = useBuildModeController()

  const signInOptions: FirebaseSignInProvider[] = ['google.com', 'password']

  // Controller for managing authentication
  const authController: FirebaseAuthController = useFirebaseAuthController({
    firebaseApp,
    signInOptions,
  })

  // Controller for saving some user preferences locally.
  const userConfigPersistence = useBuildLocalConfigurationPersistence()

  // Delegate used for fetching and saving data in Firestore
  const firestoreDelegate = useFirestoreDelegate({
    firebaseApp,
  })

  // Controller used for saving and fetching files in storage
  const storageSource = useFirebaseStorageSource({
    firebaseApp,
  })

  const { authLoading, canAccessMainView, notAllowedError } = useValidateAuthenticator({
    authController,
    authenticator: myAuthenticator,
    // TODO: remove after fire CMS fixes this
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any typescript/no-unsafe-type-assertion
    dataSourceDelegate: firestoreDelegate as any,
    storageSource,
  })

  const navigationController = useBuildNavigationController({
    disabled: authLoading,
    collections,
    authController,
    // TODO: remove after fire CMS fixes this
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any typescript/no-unsafe-type-assertion
    dataSourceDelegate: firestoreDelegate as any,
  })

  if (firebaseConfigLoading || !firebaseApp) {
    return <CircularProgressCenter />
  }

  if (configError) {
    return <div>{configError}</div>
  }

  return (
    <SnackbarProvider>
      <ModeControllerProvider value={modeController}>
        <FireCMS
          navigationController={navigationController}
          authController={authController}
          userConfigPersistence={userConfigPersistence}
          // TODO: remove after fire CMS fixes this incompatibility
          // oxlint-disable-next-line @typescript-eslint/no-explicit-any typescript/no-unsafe-type-assertion
          dataSourceDelegate={firestoreDelegate as any}
          storageSource={storageSource}
        >
          {({ context: _context, loading }) => {
            if (loading || authLoading) {
              return <CircularProgressCenter size="large" />
            }

            if (!canAccessMainView) {
              return (
                <FirebaseLoginView
                  authController={authController}
                  firebaseApp={firebaseApp}
                  signInOptions={signInOptions}
                  notAllowedError={notAllowedError}
                />
              )
            }

            return (
              <Scaffold autoOpenDrawer={false}>
                <AppBar title="My demo app" />
                <Drawer />
                <NavigationRoutes />
                <SideDialogs />
              </Scaffold>
            )
          }}
        </FireCMS>
      </ModeControllerProvider>
    </SnackbarProvider>
  )
}

export default App
