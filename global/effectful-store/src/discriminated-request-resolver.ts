// oxlint-disable typescript/no-unsafe-type-assertion
import { Effect, Request as EffectRequest, RequestResolver } from 'effect'
import type { ReadonlyRecord } from 'effect/Record'

import { UnhandledError } from '@assessmentis/ontology'
import { MappedRecord } from '@assessmentis/util'

/**
 * A batch handler that receives grouped requests and completes each one
 * via `Request.succeed` / `Request.fail`, mirroring `RequestResolver.makeBatched`.
 */
interface GroupHandler<
  KeyName extends string,
  TReq extends EffectRequest.Request<any, any> & ReadonlyRecord<KeyName, string>,
  R,
> {
  (requests: readonly TReq[]): Effect.Effect<void, never, R>
}

type Req<Fn> = Fn extends GroupHandler<infer _KeyName, infer TReq, infer _R> ? TReq : never

type RType<Fn> = Fn extends GroupHandler<infer _KeyName, infer _TReq, infer R> ? R : never

type ResolverReq<T> = T extends RequestResolver.RequestResolver<infer A, infer _R> ? A : never

type ResolverR<T> = T extends RequestResolver.RequestResolver<infer _A, infer R> ? R : never

/**
 * Creates a batched `RequestResolver` that dispatches incoming requests
 * to dedicated handler functions based on a discriminant key (e.g. `_tag`).
 *
 * Each handler receives its group of requests and is responsible for
 * completing them via `Request.succeed` / `Request.fail`, mirroring
 * the contract of `RequestResolver.makeBatched`. If a handler defects,
 * all requests in that group are failed with an `UnhandledError`.
 * Failures in one group do not affect other groups.
 *
 * @example
 * ```ts
 * DiscriminatedRequestResolver.fromBatchedRunners('_tag', ['Get', 'Search'] as const, {
 *   Get: (requests) =>
 *     Effect.forEach(requests, (req) =>
 *       fetchById(req.id).pipe(
 *         Effect.flatMap((v) => Request.succeed(req, v)),
 *         Effect.catchAll((e) => Request.fail(req, e)),
 *       )
 *     ),
 *   Search: (requests) =>
 *     Effect.forEach(requests, (req) =>
 *       search(req.query).pipe(
 *         Effect.flatMap((v) => Request.succeed(req, v)),
 *         Effect.catchAll((e) => Request.fail(req, e)),
 *       )
 *     ),
 * })
 * ```
 */
function fromBatchedRunners<
  KeyName extends string,
  Keys extends readonly string[],
  Fns extends MappedRecord.MappedRecord<
    Keys,
    {
      readonly [K in Keys[number]]: GroupHandler<KeyName, any, RType<Fns[Keys[number]]>>
    }
  >,
>(
  keyName: KeyName,
  keys: Keys,
  fnsIn: Omit<Fns, MappedRecord.KeyList>
): RequestResolver.RequestResolver<Req<Fns[Keys[number]]>, RType<Fns[Keys[number]]>> {
  type AllReqs = Req<Fns[Keys[number]]>
  const fns: Fns = { ...fnsIn, [MappedRecord.KeyList]: keys } as any
  return RequestResolver.makeBatched((requests: Array<AllReqs>) =>
    Effect.gen(function* () {
      const grouped = MappedRecord.groupInto<KeyName, Keys, AllReqs>(keys, requests, keyName)
      const groupsAndHandlers = MappedRecord.zip<Keys, typeof grouped, Fns>(keys, grouped, fns)

      const effectGroups = MappedRecord.map<
        Keys,
        typeof groupsAndHandlers,
        Effect.Effect<void, never, RType<Fns[Keys[number]]>>
        // oxlint-disable-next-line unicorn/no-array-callback-reference
      >(groupsAndHandlers, (pair) =>
        pair[1](pair[0]).pipe(
          Effect.catchAllDefect((defect) =>
            Effect.forEach(pair[0], (member) =>
              EffectRequest.fail(member, UnhandledError.fromUnknown(defect) as any)
            )
          ),
          Effect.asVoid
        )
      )
      const effects = MappedRecord.entriesOf(effectGroups).map(
        ([, eff]) => eff as Effect.Effect<void, never, RType<Fns[Keys[number]]>>
      )
      yield* Effect.all(effects, {
        concurrency: 'unbounded',
        batching: true,
      }).pipe(Effect.asVoid)
    })
  )
}

/**
 * Creates a batched `RequestResolver` that dispatches incoming requests
 * to dedicated sub-resolvers based on a discriminant key (e.g. `_tag`).
 *
 * Unlike {@link fromBatchedRunners} where handlers complete requests directly,
 * this variant accepts pre-built `RequestResolver` instances per key and
 * re-dispatches grouped requests to them. If a sub-resolver defects,
 * all requests in that group are failed with an `UnhandledError`.
 * Failures in one group do not affect other groups.
 *
 * @example
 * ```ts
 * DiscriminatedRequestResolver.fromRequestResolvers('operation', ['Get', 'Search'] as const, {
 *   Get: getResolver,
 *   Search: searchResolver,
 * })
 * ```
 */
function fromRequestResolvers<
  KeyName extends string,
  Keys extends readonly string[],
  Rs extends MappedRecord.MappedRecord<
    Keys,
    {
      readonly [K in Keys[number]]: RequestResolver.RequestResolver<any, any>
    }
  >,
>(
  keyName: KeyName,
  keys: Keys,
  resolversIn: Omit<Rs, MappedRecord.KeyList>
): RequestResolver.RequestResolver<ResolverReq<Rs[Keys[number]]>, ResolverR<Rs[Keys[number]]>> {
  type AllReqs = ResolverReq<Rs[Keys[number]]> & ReadonlyRecord<KeyName, string>
  type AllR = ResolverR<Rs[Keys[number]]>

  const resolvers: Rs = { ...resolversIn, [MappedRecord.KeyList]: keys } as any

  // Use fromEffect (not makeBatched) to avoid deadlocking: a makeBatched handler
  // that calls Effect.request would wait for sub-resolvers that can't fire until
  // the outer handler completes. Sub-resolvers handle their own batching.
  return RequestResolver.fromEffect((request: AllReqs) => {
    const key = request[keyName] as string
    const resolver = resolvers[key as Keys[number]] as unknown as RequestResolver.RequestResolver<
      AllReqs,
      never
    >
    return Effect.request(request, resolver).pipe(
      Effect.catchAllDefect((defect) => Effect.fail(UnhandledError.fromUnknown(defect) as any))
    )
  }) as RequestResolver.RequestResolver<ResolverReq<Rs[Keys[number]]>, AllR>
}
export type { GroupHandler }
export { fromBatchedRunners, fromRequestResolvers }
