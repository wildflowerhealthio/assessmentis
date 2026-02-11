import { Context } from 'effect'
import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

export class FirebaseWeb extends Context.Tag('FirebaseWeb')<
  FirebaseWeb,
  {
    app: FirebaseApp
    auth: Auth
    firestore: Firestore
  }
>() {}
