import { Context, Effect, Layer } from 'effect'
import { App, AppOptions, initializeApp, getApp } from 'firebase-admin/app'
import { Firestore, getFirestore } from 'firebase-admin/firestore'
import { Auth, getAuth } from 'firebase-admin/auth'

export class FirebaseApp extends Context.Tag('FirebaseApp')<
  FirebaseApp,
  App
>() {}

export class FirebaseFirestore extends Context.Tag('FirebaseFirestore')<
  FirebaseFirestore,
  Firestore
>() {}

export class FirebaseAuth extends Context.Tag('FirebaseAuth')<
  FirebaseAuth,
  Auth
>() {}

export interface FirebaseAdminConfig {
  projectId: string
  storageBucket?: string
  databaseId?: string
}

export const FirebaseAdminAppLive = (config: FirebaseAdminConfig) =>
  Layer.sync(FirebaseApp, () => {
    try {
      // Try to get existing app first (singleton pattern)
      return getApp()
    } catch {
      // Initialize new app if doesn't exist
      const appOptions: AppOptions = {
        projectId: config.projectId,
        storageBucket: config.storageBucket,
      }
      return initializeApp(appOptions)
    }
  })

export const FirebaseAdminFirestoreLive = (databaseId?: string) =>
  Layer.effect(
    FirebaseFirestore,
    Effect.gen(function* () {
      const app = yield* FirebaseApp
      const db =
        databaseId == undefined
          ? getFirestore(app)
          : getFirestore(app, databaseId)
      db.settings({ ignoreUndefinedProperties: true })
      return db
    })
  )

export const FirebaseAdminAuthLive = Layer.effect(
  FirebaseAuth,
  Effect.gen(function* () {
    const app = yield* FirebaseApp
    return getAuth(app)
  })
)

export const FirebaseAdminLive = (config: FirebaseAdminConfig) =>
  Layer.mergeAll(
    FirebaseAdminAppLive(config),
    FirebaseAdminFirestoreLive(config.databaseId),
    FirebaseAdminAuthLive
  )
