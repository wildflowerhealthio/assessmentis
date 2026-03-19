import {
  DateTime,
  Duration,
  Effect,
  Either,
  Fiber,
  HashMap,
  Option,
  Readable,
  Schema,
  Stream,
  Subscribable,
  SubscriptionRef,
  SynchronizedRef,
  pipe,
} from 'effect'
import type { Scope } from 'effect'
import { pipeArguments } from 'effect/Pipeable'

import type { NotFoundError } from '@assessmentis/ontology'
import { BadDataError, Loading, UnhandledError } from '@assessmentis/ontology'
import { StreamEither } from '@assessmentis/util'

import type {
  CredentialError,
  CredentialRepository,
  CredentialToken,
  CredentialTokenDefinition,
  LiveCredential,
  TokenStreamError,
} from '../tagClasses/credential-repository'
import { DocumentStore } from '../tagClasses/document-store'
import type { DocumentPath } from '../tagClasses/document-store'

/**
 * Constructor contract for a credential constructor backed by DocumentStore.
 *
 * Extends {@link CredentialTokenDefinition} with a constructor that accepts an
 * identity and a state ref, producing a {@link DocumentStoreLiveCredential}.
 */
export interface DocumentStoreCredentialConstructor<
  Tag extends string,
  TIdentifier extends { readonly _tag: Tag },
  TCredentialToken extends CredentialToken<TCredentialToken, Tag>,
  TCredentialTokenEncoded,
  TTokenContext,
> extends CredentialTokenDefinition<Tag, TCredentialToken, TCredentialTokenEncoded> {
  new (
    identity: TIdentifier,
    stateRef: SubscriptionRef.SubscriptionRef<Either.Either<TCredentialToken, CredentialError>>
  ): DocumentStoreLiveCredential<Tag, TCredentialToken, TTokenContext>

  /** Derive the DocumentStore path for a given identity without constructing a LiveCredential. */
  pathFor(identity: TIdentifier): DocumentPath

  /** One-shot read of the current credential value. No watch, no Scope required. */
  readOnce(
    identity: TIdentifier
  ): Effect.Effect<
    TCredentialToken,
    BadDataError | NotFoundError<'Document', { path: readonly string[] }> | UnhandledError,
    DocumentStore
  >

  /** Encode and persist a credential token. */
  store(
    identity: TIdentifier,
    token: TCredentialToken
  ): Effect.Effect<void, UnhandledError, DocumentStore>
}

/**
 * Abstract base for credentials stored as DocumentStore documents.
 *
 * Provides `get` and `changes` backed by a {@link SubscriptionRef} (context-free),
 * leaving `refresh` to subclasses. Each subclass declares its `path` in the
 * DocumentStore and a `refresh` effect with its own service requirements.
 *
 * @typeParam Tag - Discriminant tag for the token type
 * @typeParam TCredentialToken - The token value type
 * @typeParam TTokenContext - Refresh context: Effect services the subclass's
 *   `refresh` needs, beyond `Scope`
 */
export abstract class DocumentStoreLiveCredential<
  out Tag extends string,
  out TCredentialToken extends CredentialToken<TCredentialToken, Tag>,
  out TTokenContext,
> implements LiveCredential<Tag, TCredentialToken, TTokenContext> {
  static readonly refreshBuffer: Duration.Duration = Duration.minutes(15)

  /**
   * Build a one-shot read effect for a credential at the given path.
   * Subclasses delegate their static `readOnce` to this.
   */
  protected static _readOnce<T, TEncoded>(
    schema: Schema.Schema<T, TEncoded>,
    path: DocumentPath
  ): Effect.Effect<
    T,
    BadDataError | NotFoundError<'Document', { path: readonly string[] }> | UnhandledError,
    DocumentStore
  > {
    return Effect.flatMap(DocumentStore, (ds) =>
      ds.get(path).pipe(
        Effect.flatMap((data) =>
          Schema.decodeUnknown(schema)(data).pipe(
            Effect.mapError(
              (cause) =>
                new BadDataError({
                  cause,
                  message: `Error decoding credential at ${path.join('/')}`,
                })
            )
          )
        )
      )
    )
  }

  /**
   * Build a write effect for a credential at the given path.
   * Subclasses delegate their static `store` to this.
   */
  protected static _store<T, TEncoded extends Record<string, unknown>>(
    schema: Schema.Schema<T, TEncoded>,
    path: DocumentPath,
    token: T
  ): Effect.Effect<void, UnhandledError, DocumentStore> {
    return Schema.encode(schema)(token).pipe(
      Effect.mapError(
        (cause) =>
          new UnhandledError({
            cause,
            message: `Error encoding credential at ${path.join('/')}`,
          })
      ),
      Effect.flatMap((encoded) => Effect.flatMap(DocumentStore, (ds) => ds.set(encoded, path)))
    )
  }

  readonly [Readable.TypeId]: typeof Readable.TypeId = Readable.TypeId
  readonly [Subscribable.TypeId]: typeof Subscribable.TypeId = Subscribable.TypeId
  readonly get: Effect.Effect<TCredentialToken, CredentialError>
  readonly changes: SubscriptionRef.SubscriptionRef<
    Either.Either<TCredentialToken, CredentialError>
  >['changes']

  constructor(
    public readonly path: DocumentPath,
    stateRef: SubscriptionRef.SubscriptionRef<Either.Either<TCredentialToken, CredentialError>>
  ) {
    this.get = Effect.flatMap(SubscriptionRef.get(stateRef), (either) =>
      Either.match(either, {
        onLeft: (error) => Effect.fail(error),
        onRight: (value) => Effect.succeed(value),
      })
    )

    this.changes = stateRef.changes
  }

  pipe(..._args: ReadonlyArray<unknown>): unknown {
    // oxlint-disable-next-line prefer-rest-params
    return pipeArguments(this, arguments)
  }

  public abstract readonly refresh: Effect.Effect<
    void,
    TokenStreamError,
    TTokenContext | Scope.Scope
  >
}

/**
 * Creates a {@link CredentialRepository} backed by DocumentStore.
 *
 * For each identity, sets up:
 * 1. A DocumentStore watch that decodes token updates into a SubscriptionRef
 * 2. Proactive refresh — forks a fiber that refreshes `refreshBuffer` before expiry
 * 3. Per-identity caching so repeated `get` calls return the same live credential
 *
 * Requires {@link DocumentStore} at construction time. The returned service's
 * `get` method requires `Scope | TTokenContext`.
 */
export const makeDocumentStoreCredentialRepository = <
  Tag extends string,
  TIdentifier extends { readonly _tag: Tag },
  TCredentialToken extends CredentialToken<TCredentialToken, Tag>,
  TCredentialTokenEncoded,
  TTokenContext,
  CredentialClass extends DocumentStoreCredentialConstructor<
    Tag,
    TIdentifier,
    TCredentialToken,
    TCredentialTokenEncoded,
    TTokenContext
  >,
>(
  CredentialClass: CredentialClass
): Effect.Effect<
  CredentialRepository<Tag, TIdentifier, TCredentialToken, TTokenContext>,
  never,
  DocumentStore
> =>
  Effect.gen(function* makeDocumentStoreCredentialRepositoryGen() {
    const documentStore = yield* DocumentStore
    // SynchronizedRef prevents concurrent get() calls from creating duplicate
    // Credentials for the same identity. The update is atomic — only the first
    // Caller creates the credential; subsequent callers see the cached entry.
    const cache = yield* SynchronizedRef.make(
      HashMap.empty<
        TIdentifier,
        DocumentStoreLiveCredential<Tag, TCredentialToken, TTokenContext>
      >()
    )

    const createCredential = (
      identity: TIdentifier
    ): Effect.Effect<
      DocumentStoreLiveCredential<Tag, TCredentialToken, TTokenContext>,
      never,
      Scope.Scope | TTokenContext
    > =>
      Effect.gen(function* createCredentialGen() {
        const stateRef = yield* SubscriptionRef.make<
          Either.Either<TCredentialToken, CredentialError>
        >(
          Either.left(
            new Loading({
              entity: { toString: (): string => JSON.stringify(identity) },
            })
          )
        )

        const credential: DocumentStoreLiveCredential<Tag, TCredentialToken, TTokenContext> =
          new CredentialClass(identity, stateRef)

        // Start Firestore watch, feeding decoded values into the SubscriptionRef
        const watchStream = documentStore.subscribeTo(credential.path).pipe(
          StreamEither.mapEffect((data) =>
            Schema.decodeUnknown(CredentialClass.schema)(data).pipe(
              Effect.mapError(
                (cause) =>
                  new BadDataError({
                    cause,
                    message: `Error decoding credential at ${credential.path.join('/')}`,
                  })
              )
            )
          )
        )

        // Schedule proactive token refresh before expiry
        const nextRefreshFiber = yield* SynchronizedRef.make<
          Option.Option<Fiber.Fiber<void, TokenStreamError>>
        >(Option.none())

        const scheduleRefresh = (
          token: TCredentialToken
        ): Effect.Effect<
          Fiber.Fiber<void, TokenStreamError>,
          never,
          Scope.Scope | TTokenContext
        > => {
          const { expiresAt } = token
          if (!expiresAt) {
            return Effect.succeed(Fiber.void)
          }

          const refreshInDuration = Effect.map(DateTime.now, (now) =>
            Duration.subtract(
              DateTime.distanceDuration(expiresAt, now),
              CredentialClass.refreshBuffer
            )
          )

          const safeRefresh = credential.refresh.pipe(
            Effect.tapError((e) => Effect.logError('Credential refresh failed:', e))
          )

          return Effect.fork(
            pipe(
              refreshInDuration,
              Effect.map(Duration.max(Duration.zero)),
              Effect.flatMap((d) => Effect.delay(d)(safeRefresh)),
              Effect.asVoid
            )
          )
        }

        const watchWithRefresh = watchStream.pipe(
          StreamEither.tapRight((token) =>
            SynchronizedRef.updateEffect(
              nextRefreshFiber,
              Option.match({
                onNone() {
                  return scheduleRefresh(token).pipe(Effect.map(Option.some))
                },
                onSome(a) {
                  return pipe(
                    Fiber.interrupt(a),
                    Effect.flatMap(() => scheduleRefresh(token)),
                    Effect.map(Option.some)
                  )
                },
              })
            )
          )
        )

        // Fork fiber that drains the watch stream into the SubscriptionRef
        yield* Stream.runForEach(watchWithRefresh, (value) =>
          SubscriptionRef.set(stateRef, value)
        ).pipe(Effect.forkScoped)

        return credential
      })

    const repository: CredentialRepository<Tag, TIdentifier, TCredentialToken, TTokenContext> = {
      get(
        identity: TIdentifier
      ): Effect.Effect<
        LiveCredential<Tag, TCredentialToken, TTokenContext>,
        never,
        Scope.Scope | TTokenContext
      > {
        return SynchronizedRef.modifyEffect(cache, (currentCache) => {
          const existing = HashMap.get(currentCache, identity)
          if (Option.isSome(existing)) {
            return Effect.succeed([existing.value, currentCache] as const)
          }

          return createCredential(identity).pipe(
            Effect.map(
              (credential) => [credential, HashMap.set(currentCache, identity, credential)] as const
            )
          )
        })
      },
    }

    return repository
  })
