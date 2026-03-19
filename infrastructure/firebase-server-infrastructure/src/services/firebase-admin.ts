import { Effect } from 'effect'

import { getApp, initializeApp } from 'firebase-admin/app'
import type { App, AppOptions } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

/**
 * Firebase configuration for the Assessmentis project
 */
const firebaseConfig = {
  databaseId: 'assessmentis',
  projectId: 'assessmentis',
  storageBucket: 'assessmentis.firebasestorage.app',
}

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

export { firebaseConfig, FirebaseAdmin }
