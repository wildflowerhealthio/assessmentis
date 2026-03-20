import { Layer } from 'effect'

import { FirebasePlatformRoutes, FirebaseWeb } from '@assessmentis/firebase-web-infrastructure'

import { initializeApp } from 'firebase/app'
import type { FirebaseOptions } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyC1OAnpn5Aj6EQqnDNCKI4b26CgHm_-aTc',
  appId: '1:363489601410:web:5a39eb160d09c84fae519b',
  authDomain: 'assessmentis.firebaseapp.com',
  messagingSenderId: '363489601410',
  projectId: 'assessmentis',
  storageBucket: 'assessmentis.firebasestorage.app',
} satisfies FirebaseOptions

const databaseId = 'assessmentis'

// Initialize Firebase
const app = initializeApp(firebaseConfig)
app.automaticDataCollectionEnabled = false

const db = getFirestore(app, databaseId)

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app)

/** Platform routes for the Assessmentis Firebase project. */
const platformRoutes = new FirebasePlatformRoutes({
  projectId: firebaseConfig.projectId,
  databaseId,
})

const FirebaseWebLayer = Layer.succeed(FirebaseWeb, {
  app,
  auth,
  firestore: db,
})

export { app, auth, db, platformRoutes, FirebaseWebLayer }
