import { it } from '@effect/vitest'
import {
  Context,
  Data,
  Duration,
  Effect,
  Either,
  Equal,
  Exit,
  Fiber,
  Ref,
  Schema,
  Stream,
  SubscriptionRef,
  TestClock,
} from 'effect'
import type { Scope } from 'effect'
import { describe, expect, test } from 'vitest'

import { NotFoundError, UnhandledError } from '@assessmentis/ontology'

import type {
  CredentialError,
  CredentialToken,
  TokenStreamError,
} from '../tagClasses/credential-repository'
import { DocumentStore } from '../tagClasses/document-store'
import type { DocumentData, DocumentPath } from '../tagClasses/document-store'
import {
  DocumentStoreLiveCredential,
  credentialRefreshRetrySchedule,
  makeDocumentStoreCredentialRepository,
} from './document-store-credential-repository'

class TestToken
  extends Schema.Class<TestToken>('TestToken')({
    _tag: Schema.Literal('test'),
    accessToken: Schema.String,
    expiresAt: Schema.Undefined,
  })
  implements CredentialToken<TestToken, 'test'>
{
  asInvalidated(): TestToken {
    return new TestToken({ _tag: 'test', accessToken: '', expiresAt: undefined })
  }
}

class TestIdentity extends Data.TaggedClass('test')<{ readonly userId: string }> {}

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

function makeMockDocumentStoreService(
  responses: Record<string, DocumentData>
): Context.Tag.Service<typeof DocumentStore> {
  return {
    get: (path: DocumentPath) => {
      const key = path.join('/')
      const data = responses[key]
      if (data) {
        return Effect.succeed(data)
      }
      return Effect.fail(
        new NotFoundError({ resourceType: 'Document' as const, params: { path } })
      ) as ReturnType<Context.Tag.Service<typeof DocumentStore>['get']>
    },
    set: () => Effect.void,
    subscribeTo: (path: DocumentPath) => {
      const key = path.join('/')
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
        yield* Effect.sleep('2 millis')
        return yield* credential.get
      }).pipe(
        Effect.provideService(
          DocumentStore,
          makeMockDocumentStoreService({ 'credentials/user1': tokenData })
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

describe('credentialRefreshRetrySchedule', () => {
  it.effect('retries up to 5 times on repeated failure, for 6 total attempts', () =>
    Effect.gen(function* retryMaxAttempts() {
      const attemptsRef = yield* Ref.make(0)
      const failingEffect = Ref.update(attemptsRef, (n) => n + 1).pipe(
        Effect.andThen(Effect.fail(new UnhandledError({ cause: 'test failure', message: 'test' })))
      )
      const fiber = yield* failingEffect.pipe(
        Effect.retry({ schedule: credentialRefreshRetrySchedule }),
        Effect.exit,
        Effect.fork
      )
      yield* TestClock.adjust(Duration.seconds(155))
      const exit = yield* Fiber.join(fiber)
      const attempts = yield* Ref.get(attemptsRef)
      expect(attempts).toBe(6)
      expect(Exit.isFailure(exit)).toBe(true)
    })
  )

  it.effect('does not retry when the effect succeeds on the first attempt', () =>
    Effect.gen(function* noRetryOnSuccess() {
      const attemptsRef = yield* Ref.make(0)
      yield* Ref.update(attemptsRef, (n) => n + 1).pipe(
        Effect.retry({ schedule: credentialRefreshRetrySchedule })
      )
      const attempts = yield* Ref.get(attemptsRef)
      expect(attempts).toBe(1)
    })
  )

  it.effect('stops retrying after the first success', () =>
    Effect.gen(function* stopAfterSuccess() {
      const attemptsRef = yield* Ref.make(0)
      const failThenSucceed = Ref.updateAndGet(attemptsRef, (n) => n + 1).pipe(
        Effect.flatMap((count) =>
          count <= 2
            ? Effect.fail(new UnhandledError({ cause: 'transient', message: 'test' }))
            : Effect.void
        )
      )
      const fiber = yield* failThenSucceed.pipe(
        Effect.retry({ schedule: credentialRefreshRetrySchedule }),
        Effect.fork
      )
      yield* TestClock.adjust(Duration.seconds(15))
      yield* Fiber.join(fiber)
      const attempts = yield* Ref.get(attemptsRef)
      expect(attempts).toBe(3)
    })
  )

  it.effect('uses exponential backoff with 5-second base delay', () =>
    Effect.gen(function* exponentialBackoff() {
      const timestampsRef = yield* Ref.make<number[]>([])
      const failingEffect = Effect.flatMap(TestClock.currentTimeMillis, (now) =>
        Ref.update(timestampsRef, (ts) => [...ts, now]).pipe(
          Effect.andThen(Effect.fail(new UnhandledError({ cause: 'test', message: 'test' })))
        )
      )
      const fiber = yield* failingEffect.pipe(
        Effect.retry({ schedule: credentialRefreshRetrySchedule }),
        Effect.exit,
        Effect.fork
      )
      yield* TestClock.adjust(Duration.seconds(5))
      yield* TestClock.adjust(Duration.seconds(10))
      yield* TestClock.adjust(Duration.seconds(20))
      yield* TestClock.adjust(Duration.seconds(40))
      yield* TestClock.adjust(Duration.seconds(80))
      yield* Fiber.join(fiber)
      const timestamps = yield* Ref.get(timestampsRef)
      expect(timestamps).toHaveLength(6)
      const delays = timestamps.slice(1).map((ts, i) => ts - timestamps[i])
      expect(delays).toEqual([5000, 10000, 20000, 40000, 80000])
    })
  )

  it.effect('total retry time is well within the 15-minute refresh buffer', () =>
    Effect.gen(function* withinRefreshBuffer() {
      const startTime = yield* TestClock.currentTimeMillis
      const fiber = yield* Effect.fail(new UnhandledError({ cause: 'test', message: 'test' })).pipe(
        Effect.retry({ schedule: credentialRefreshRetrySchedule }),
        Effect.exit,
        Effect.fork
      )
      yield* TestClock.adjust(Duration.seconds(155))
      yield* Fiber.join(fiber)
      const endTime = yield* TestClock.currentTimeMillis
      expect(Duration.lessThan(Duration.millis(endTime - startTime), Duration.minutes(15))).toBe(
        true
      )
    })
  )
})
