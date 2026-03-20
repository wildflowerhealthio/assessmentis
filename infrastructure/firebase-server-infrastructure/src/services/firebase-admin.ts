import { Effect } from 'effect'

import { buildAuthBaseUrl, buildFirestoreBaseUrl } from '@assessmentis/firebase-domain'
import type { FirebaseUrlConfig } from '@assessmentis/firebase-domain'

import { getApp, initializeApp } from 'firebase-admin/app'
import type { App, AppOptions } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

/**
 * Firebase configuration for the Assessmentis project.
 */
const firebaseConfig = {
  databaseId: 'assessmentis',
  projectId: 'assessmentis',
  storageBucket: 'assessmentis.firebasestorage.app',
} satisfies FirebaseUrlConfig & { storageBucket: string }

/** Base URL for Firestore documents, used by platform URL helpers. */
const firestoreBaseUrl = buildFirestoreBaseUrl(firebaseConfig)

/** Base URL for Firebase Auth credentials (e.g. proxy tokens). */
const authBaseUrl = buildAuthBaseUrl(firebaseConfig.projectId)

class FirebaseAdmin extends Effect.Service<FirebaseAdmin>()('FirebaseAdmin', {
  dependencies: [],

  effect: Effect.sync(() => {
    let app: App
    try {
      // Try to get existing app first (singleton pattern)
      app = getApp()
    } catch {
      // Initialize new app if doesn't exist
      const appOptions: AppOptions = {
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
      }
      app = initializeApp(appOptions)
    }
    const auth = getAuth(app)
    let firestore: Firestore
    if (firebaseConfig.databaseId === undefined) {
      firestore = getFirestore(app)
    } else {
      firestore = getFirestore(app, firebaseConfig.databaseId)
    }
    firestore.settings({ ignoreUndefinedProperties: true })
    return { app, auth, firestore }
  }),
}) {}

export { authBaseUrl, firebaseConfig, firestoreBaseUrl, FirebaseAdmin }
