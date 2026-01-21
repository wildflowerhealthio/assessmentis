import { Context } from 'effect'
import { FirebaseApp } from 'firebase/app'
import { Auth } from 'firebase/auth'
import { Firestore } from 'firebase/firestore'

export class FirebaseWeb extends Context.Tag('FirebaseWeb')<
  FirebaseWeb,
  {
    app: FirebaseApp
    auth: Auth
    firestore: Firestore
  }
>() {}
