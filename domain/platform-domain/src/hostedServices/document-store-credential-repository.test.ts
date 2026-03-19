import {
  Context,
  Data,
  Duration,
  Effect,
  Either,
  Equal,
  Schema,
  Stream,
  SubscriptionRef,
} from 'effect'
import type { Scope } from 'effect'
import { describe, expect, test } from 'vitest'

import { NotFoundError } from '@assessmentis/ontology'

import type {
  CredentialError,
  CredentialToken,
  TokenStreamError,
} from '../tagClasses/credential-repository'
import { DocumentStore } from '../tagClasses/document-store'
import type { DocumentData, DocumentPath } from '../tagClasses/document-store'
import {
  DocumentStoreLiveCredential,
  makeDocumentStoreCredentialRepository,
} from './document-store-credential-repository'

// --- Test token type ---

class TestToken
  extends Schema.Class<TestToken>('TestToken')({
    _tag: Schema.Literal('test'),
    accessToken: Schema.String,
    expiresAt: Schema.Undefined,
  })
  implements CredentialToken<TestToken, 'test'>
{
  asInvalidated(): TestToken {
    return new TestToken({
      _tag: 'test',
      accessToken: '',
      expiresAt: undefined,
    })
  }
}
// --- Test credential class ---

class TestIdentity extends Data.TaggedClass('test')<{
  readonly userId: string
}> {}

class TestLiveCredential extends DocumentStoreLiveCredential<'test', TestToken, never> {
  static readonly schema = TestToken
  static readonly refreshBuffer = Duration.minutes(5)

  static pathFor(identity: TestIdentity): DocumentPath {
    return ['credentials', identity.userId] satisfies readonly [string, string] as DocumentPath
  }

  static readOnce(identity: TestIdentity) {
    return DocumentStoreLiveCredential._readOnce(TestToken, TestLiveCredential.pathFor(identity))
  }

  static store(identity: TestIdentity, token: TestToken) {
    return DocumentStoreLiveCredential._store(
      TestToken,
      TestLiveCredential.pathFor(identity),
      token
    )
  }

  readonly refresh = Effect.void satisfies Effect.Effect<void, never> as Effect.Effect<
    void,
    TokenStreamError,
    Scope.Scope
  >

  constructor(
    identity: TestIdentity,
    stateRef: SubscriptionRef.SubscriptionRef<Either.Either<TestToken, CredentialError>>
  ) {
    super(TestLiveCredential.pathFor(identity), stateRef)
  }
}

// Helper to create mock DocumentStore service
function makeMockDocumentStoreService(
  responses: Record<string, DocumentData>
): Context.Tag.Service<typeof DocumentStore> {
  return {
    get: (...path: DocumentPath | readonly [DocumentPath]) => {
      let resolved: DocumentPath | readonly [DocumentPath]
      if (path.length === 1) {
        resolved = path[0]
      } else {
        resolved = path
      }
      const key = (resolved as readonly string[]).join('/')
      const data = responses[key]
      if (data) {
        return Effect.succeed(data)
      }
      return Effect.fail(
        new NotFoundError({
          resourceType: 'Document' as const,
          params: { path: resolved },
        })
      ) as ReturnType<Context.Tag.Service<typeof DocumentStore>['get']>
    },
    set: () => Effect.void,
    subscribeTo: (...path: DocumentPath | readonly [DocumentPath]) => {
      let resolved: DocumentPath | readonly [DocumentPath]
      if (path.length === 1 && Array.isArray(path[0])) {
        resolved = path[0]
      } else {
        resolved = path
      }
      const key = (resolved as readonly string[]).join('/')
      const data = responses[key]
      if (data) {
        return Stream.make(Either.right(data))
      }
      return Stream.never
    },
    update: () => Effect.void,
  }
}

describe('makeDocumentStoreCredentialRepository', () => {
  test('creates a repository that returns credentials', async () => {
    const identity = new TestIdentity({ userId: 'user1' })
    const tokenData = { _tag: 'test', accessToken: 'abc123' }

    const result = await Effect.runPromise(
      Effect.gen(function* result() {
        const repo = yield* makeDocumentStoreCredentialRepository<
          'test',
          TestIdentity,
          TestToken,
          typeof TestToken.Encoded,
          never,
          typeof TestLiveCredential
        >(TestLiveCredential)
        const credential = yield* repo.get(identity)
        // Sleep just briefly to let the credential load
        yield* Effect.sleep('2 millis')
        return yield* credential.get
      }).pipe(
        Effect.provideService(
          DocumentStore,
          makeMockDocumentStoreService({
            'credentials/user1': tokenData,
          })
        ),
        Effect.scoped
      )
    )

    expect(result.accessToken).toBe('abc123')
  })

  test('caches credentials by identity (Equal-based)', async () => {
    const identity1 = new TestIdentity({ userId: 'user1' })
    const identity2 = new TestIdentity({ userId: 'user1' })

    expect(identity1 !== identity2).toBe(true)
    expect(Equal.equals(identity1, identity2)).toBe(true)

    const result = await Effect.runPromise(
      Effect.gen(function* result() {
        const repo = yield* makeDocumentStoreCredentialRepository<
          'test',
          TestIdentity,
          TestToken,
          typeof TestToken.Encoded,
          never,
          typeof TestLiveCredential
        >(TestLiveCredential)
        const cred1 = yield* repo.get(identity1)
        const cred2 = yield* repo.get(identity2)
        return cred1 === cred2
      }).pipe(
        Effect.provideService(
          DocumentStore,
          makeMockDocumentStoreService({
            'credentials/user1': { _tag: 'test', accessToken: 'abc123' },
          })
        ),
        Effect.scoped
      )
    )

    expect(result).toBe(true)
  })

  test('returns different credentials for different identities', async () => {
    const identity1 = new TestIdentity({ userId: 'user1' })
    const identity2 = new TestIdentity({ userId: 'user2' })

    const result = await Effect.runPromise(
      Effect.gen(function* result() {
        const repo = yield* makeDocumentStoreCredentialRepository<
          'test',
          TestIdentity,
          TestToken,
          typeof TestToken.Encoded,
          never,
          typeof TestLiveCredential
        >(TestLiveCredential)
        const cred1 = yield* repo.get(identity1)
        const cred2 = yield* repo.get(identity2)
        return cred1 === cred2
      }).pipe(
        Effect.provideService(
          DocumentStore,
          makeMockDocumentStoreService({
            'credentials/user1': { _tag: 'test', accessToken: 'abc-user1' },
            'credentials/user2': { _tag: 'test', accessToken: 'abc-user2' },
          })
        ),
        Effect.scoped
      )
    )

    expect(result).toBe(false)
  })
})
