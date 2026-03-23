import { it } from '@effect/vitest'
import { it as fcIt, fc } from '@fast-check/vitest'
import { Effect, Exit, Request, RequestResolver } from 'effect'
import { assert, describe, expect } from 'vitest'

import { UnhandledError } from '@assessmentis/ontology'

import * as DiscriminatedRequestResolver from './discriminated-request-resolver'

// --- Request types ---

interface GetReq extends Request.Request<{ source: 'Get'; id: string }, Error> {
  readonly _tag: 'Get'
  readonly id: string
}

interface SearchReq extends Request.Request<{ source: 'Search'; query: string }, Error> {
  readonly _tag: 'Search'
  readonly query: string
}

describe('DiscriminatedRequestResolver', () => {
  describe('fromBatchedRunners', () => {
    it.effect('should resolve requests via handlers matching their key', () =>
      Effect.gen(function* () {
        // Arrange
        const resolver = makeTestResolver({
          Get: (requests) =>
            Effect.forEach(requests, (req) =>
              Request.succeed(req, { source: 'Get' as const, id: req.id }),
            ),
          Search: (requests) =>
            Effect.forEach(requests, (req) =>
              Request.succeed(req, { source: 'Search' as const, query: req.query }),
            ),
        })

        // Act
        const [getResult, searchResult] = yield* Effect.all(
          [
            Effect.request(makeGetReq({ id: 'patient-42' }), resolver),
            Effect.request(makeSearchReq({ query: 'lab-results' }), resolver),
          ],
          { concurrency: 'unbounded', batching: true },
        )

        // Assert
        expect(getResult).toEqual({ source: 'Get', id: 'patient-42' })
        expect(searchResult).toEqual({ source: 'Search', query: 'lab-results' })
      }),
    )

    describe('dispatch correctness', () => {
      fcIt.prop([
        fc.array(fc.string(), { minLength: 1 }),
        fc.array(fc.string(), { minLength: 1 }),
      ])(
        'should always dispatch each request to its key-matched handler',
        async (getIds, searchQueries) => {
          // Arrange
          const resolver = makeTestResolver({
            Get: (requests) =>
              Effect.forEach(requests, (req) =>
                Request.succeed(req, { source: 'Get' as const, id: req.id }),
              ),
            Search: (requests) =>
              Effect.forEach(requests, (req) =>
                Request.succeed(req, { source: 'Search' as const, query: req.query }),
              ),
          })

          // Act
          const results = await Effect.runPromise(
            Effect.all(
              [
                ...getIds.map((id) => Effect.request(makeGetReq({ id }), resolver)),
                ...searchQueries.map((query) =>
                  Effect.request(makeSearchReq({ query }), resolver),
                ),
              ],
              { concurrency: 'unbounded', batching: true },
            ),
          )

          // Assert
          const getResults = results.slice(0, getIds.length)
          const searchResults = results.slice(getIds.length)
          expect(getResults).toEqual(getIds.map((id) => ({ source: 'Get', id })))
          expect(searchResults).toEqual(
            searchQueries.map((query) => ({ source: 'Search', query })),
          )
        },
      )

      fcIt.prop([
        fc.array(fc.string(), { minLength: 1 }),
        fc.array(fc.string(), { minLength: 1 }),
      ])(
        'should deliver all requests of a key in a single batch',
        async (getIds, searchQueries) => {
          // Arrange — capture batch sizes via stub side-effects
          const getBatchSizes: number[] = []
          const searchBatchSizes: number[] = []
          const resolver = makeTestResolver({
            Get: (requests) => {
              getBatchSizes.push(requests.length)
              return Effect.forEach(requests, (req) =>
                Request.succeed(req, { source: 'Get' as const, id: req.id }),
              )
            },
            Search: (requests) => {
              searchBatchSizes.push(requests.length)
              return Effect.forEach(requests, (req) =>
                Request.succeed(req, { source: 'Search' as const, query: req.query }),
              )
            },
          })

          // Act
          await Effect.runPromise(
            Effect.all(
              [
                ...getIds.map((id) => Effect.request(makeGetReq({ id }), resolver)),
                ...searchQueries.map((query) =>
                  Effect.request(makeSearchReq({ query }), resolver),
                ),
              ],
              { concurrency: 'unbounded', batching: true },
            ),
          )

          // Assert — each handler received one batch containing all its requests
          expect(getBatchSizes).toEqual([getIds.length])
          expect(searchBatchSizes).toEqual([searchQueries.length])
        },
      )
    })

    describe('failure isolation', () => {
      fcIt.prop([
        fc.array(fc.string(), { minLength: 1 }),
        fc.array(fc.string(), { minLength: 1 }),
      ])(
        'should never fail a successful request when a different-type request fails',
        async (failingGetIds, successSearchQueries) => {
          // Arrange — Get always fails, Search always succeeds
          const resolver = makeTestResolver({
            Get: (requests) =>
              Effect.forEach(requests, (req) => Request.fail(req, new Error('get-failed'))),
            Search: (requests) =>
              Effect.forEach(requests, (req) =>
                Request.succeed(req, { source: 'Search' as const, query: req.query }),
              ),
          })

          // Act
          const exits = await Effect.runPromise(
            Effect.all(
              [
                ...failingGetIds.map((id) =>
                  Effect.request(makeGetReq({ id }), resolver).pipe(Effect.exit),
                ),
                ...successSearchQueries.map((query) =>
                  Effect.request(makeSearchReq({ query }), resolver).pipe(Effect.exit),
                ),
              ],
              { concurrency: 'unbounded', batching: true },
            ),
          )

          // Assert
          const getExits = exits.slice(0, failingGetIds.length)
          const searchExits = exits.slice(failingGetIds.length)
          for (const exit of getExits) expectFailure(exit)
          for (const [i, exit] of searchExits.entries()) {
            const value = expectSuccess(exit)
            expect(value).toEqual({ source: 'Search', query: successSearchQueries[i] })
          }
        },
      )

      fcIt.prop([
        fc.array(fc.string(), { minLength: 1 }),
        fc.array(fc.string(), { minLength: 1 }),
        fc.array(fc.string(), { minLength: 1 }),
      ])(
        'should isolate failures between requests sharing the same key',
        async (failIds, okIds, searchQueries) => {
          // Arrange — Get handler conditionally fails based on id
          const failSet = new Set(failIds)
          const cleanOkIds = okIds.filter((id) => !failSet.has(id))
          fc.pre(cleanOkIds.length > 0)

          const resolver = makeTestResolver({
            Get: (requests) =>
              Effect.forEach(requests, (req) =>
                failSet.has(req.id)
                  ? Request.fail(req, new Error(`fail-${req.id}`))
                  : Request.succeed(req, { source: 'Get' as const, id: req.id }),
              ),
            Search: (requests) =>
              Effect.forEach(requests, (req) =>
                Request.succeed(req, { source: 'Search' as const, query: req.query }),
              ),
          })

          // Act
          const exits = await Effect.runPromise(
            Effect.all(
              [
                ...failIds.map((id) =>
                  Effect.request(makeGetReq({ id }), resolver).pipe(Effect.exit),
                ),
                ...cleanOkIds.map((id) =>
                  Effect.request(makeGetReq({ id }), resolver).pipe(Effect.exit),
                ),
                ...searchQueries.map((query) =>
                  Effect.request(makeSearchReq({ query }), resolver).pipe(Effect.exit),
                ),
              ],
              { concurrency: 'unbounded', batching: true },
            ),
          )

          // Assert
          const failExits = exits.slice(0, failIds.length)
          const okExits = exits.slice(failIds.length, failIds.length + cleanOkIds.length)
          const searchExits = exits.slice(failIds.length + cleanOkIds.length)

          for (const exit of failExits) expectFailure(exit)
          for (const [i, exit] of okExits.entries()) {
            const value = expectSuccess(exit)
            expect(value).toEqual({ source: 'Get', id: cleanOkIds[i] })
          }
          for (const exit of searchExits) expectSuccess(exit)
        },
      )
    })

    describe('edge cases', () => {
      it.effect('should handle a batch where not all key types have requests', () =>
        Effect.gen(function* () {
          // Arrange
          const resolver = makeTestResolver({
            Get: (requests) =>
              Effect.forEach(requests, (req) =>
                Request.succeed(req, { source: 'Get' as const, id: req.id }),
              ),
            Search: (requests) =>
              Effect.forEach(requests, (req) =>
                Request.succeed(req, { source: 'Search' as const, query: req.query }),
              ),
          })

          // Act — only Get requests, no Search requests in this batch
          const exit = yield* Effect.request(makeGetReq({ id: 'solo' }), resolver).pipe(
            Effect.exit,
          )

          // Assert
          expect(Exit.isSuccess(exit)).toBe(true)
          if (Exit.isSuccess(exit)) {
            expect(exit.value).toEqual({ source: 'Get', id: 'solo' })
          }
        }),
      )

      it.effect('should fail unresolved requests when handler does not complete them', () =>
        Effect.gen(function* () {
          // Arrange — Get handler only completes the first request
          const resolver = makeTestResolver({
            Get: (requests) =>
              Request.succeed(requests[0], { source: 'Get' as const, id: requests[0].id }),
            Search: (requests) =>
              Effect.forEach(requests, (req) =>
                Request.succeed(req, { source: 'Search' as const, query: req.query }),
              ),
          })

          // Act
          const [first, second] = yield* Effect.all(
            [
              Effect.request(makeGetReq({ id: 'resolved' }), resolver).pipe(Effect.exit),
              Effect.request(makeGetReq({ id: 'unresolved' }), resolver).pipe(Effect.exit),
            ],
            { concurrency: 'unbounded', batching: true },
          )

          // Assert — first request resolved, second left unresolved by handler
          expectSuccess(first)
          expectFailure(second)
        }),
      )

      it.effect(
        'should fail defecting handler requests with UnhandledError and not affect other groups',
        () =>
          Effect.gen(function* () {
            // Arrange — Get handler defects, Search handler succeeds
            const resolver = makeTestResolver({
              Get: () => Effect.die('handler-boom'),
              Search: (requests) =>
                Effect.forEach(requests, (req) =>
                  Request.succeed(req, { source: 'Search' as const, query: req.query }),
                ),
            })

            // Act
            const [getExit, searchExit] = yield* Effect.all(
              [
                Effect.request(makeGetReq({ id: 'x' }), resolver).pipe(Effect.exit),
                Effect.request(makeSearchReq({ query: 'y' }), resolver).pipe(Effect.exit),
              ],
              { concurrency: 'unbounded', batching: true },
            )

            // Assert — Get fails with UnhandledError, Search succeeds
            expectFailure(getExit)
            if (Exit.isFailure(getExit)) {
              const error = getExit.cause.pipe(
                (cause) => (cause._tag === 'Fail' ? cause.error : undefined),
              )
              expect(error).toBeInstanceOf(UnhandledError)
            }
            const searchValue = expectSuccess(searchExit)
            expect(searchValue).toEqual({ source: 'Search', query: 'y' })
          }),
      )
    })
  })

  describe('fromRequestResolvers', () => {
    it.effect('should dispatch requests to the correct sub-resolver', () =>
      Effect.gen(function* () {
        // Arrange
        const resolver = makeTestResolverFromSubs({
          Get: RequestResolver.fromEffect((req: GetReq) =>
            Effect.succeed({ source: 'Get' as const, id: req.id }),
          ),
          Search: RequestResolver.fromEffect((req: SearchReq) =>
            Effect.succeed({ source: 'Search' as const, query: req.query }),
          ),
        })

        // Act
        const [getResult, searchResult] = yield* Effect.all(
          [
            Effect.request(makeGetReq({ id: 'a' }), resolver),
            Effect.request(makeSearchReq({ query: 'b' }), resolver),
          ],
          { concurrency: 'unbounded', batching: true },
        )

        // Assert
        expect(getResult).toEqual({ source: 'Get', id: 'a' })
        expect(searchResult).toEqual({ source: 'Search', query: 'b' })
      }),
    )

    it.effect('should dispatch each request to sub-resolvers individually (fromEffect semantics)', () =>
      Effect.gen(function* () {
        // Arrange — track batch sizes received by the sub-resolver
        const getBatchSizes: number[] = []
        const resolver = makeTestResolverFromSubs({
          Get: RequestResolver.makeBatched((requests: GetReq[]) => {
            getBatchSizes.push(requests.length)
            return Effect.forEach(requests, (req) =>
              Request.succeed(req, { source: 'Get' as const, id: req.id }),
            ).pipe(Effect.asVoid)
          }),
          Search: RequestResolver.fromEffect((req: SearchReq) =>
            Effect.succeed({ source: 'Search' as const, query: req.query }),
          ),
        })

        // Act — send two Get requests in one batch
        const [r1, r2] = yield* Effect.all(
          [
            Effect.request(makeGetReq({ id: '1' }), resolver),
            Effect.request(makeGetReq({ id: '2' }), resolver),
          ],
          { concurrency: 'unbounded', batching: true },
        )

        // Assert — fromEffect dispatches per-request, so sub-resolver receives
        // individual requests (not a single batch). Both still resolve correctly.
        expect(r1).toEqual({ source: 'Get', id: '1' })
        expect(r2).toEqual({ source: 'Get', id: '2' })
        const totalDispatched = getBatchSizes.reduce((a, b) => a + b, 0)
        expect(totalDispatched).toBe(2)
      }),
    )

    it.effect('should isolate defects between groups', () =>
      Effect.gen(function* () {
        // Arrange — Get sub-resolver defects, Search sub-resolver succeeds
        const resolver = makeTestResolverFromSubs({
          Get: RequestResolver.fromEffect((_req: GetReq) => Effect.die('sub-resolver-boom')),
          Search: RequestResolver.fromEffect((req: SearchReq) =>
            Effect.succeed({ source: 'Search' as const, query: req.query }),
          ),
        })

        // Act
        const [getExit, searchExit] = yield* Effect.all(
          [
            Effect.request(makeGetReq({ id: 'x' }), resolver).pipe(Effect.exit),
            Effect.request(makeSearchReq({ query: 'y' }), resolver).pipe(Effect.exit),
          ],
          { concurrency: 'unbounded', batching: true },
        )

        // Assert — Get fails with UnhandledError, Search succeeds
        expectFailure(getExit)
        if (Exit.isFailure(getExit)) {
          const error = getExit.cause.pipe(
            (cause) => (cause._tag === 'Fail' ? cause.error : undefined),
          )
          expect(error).toBeInstanceOf(UnhandledError)
        }
        const searchValue = expectSuccess(searchExit)
        expect(searchValue).toEqual({ source: 'Search', query: 'y' })
      }),
    )

    it.effect('should handle a batch where not all key types have requests', () =>
      Effect.gen(function* () {
        // Arrange
        const resolver = makeTestResolverFromSubs({
          Get: RequestResolver.fromEffect((req: GetReq) =>
            Effect.succeed({ source: 'Get' as const, id: req.id }),
          ),
          Search: RequestResolver.fromEffect((req: SearchReq) =>
            Effect.succeed({ source: 'Search' as const, query: req.query }),
          ),
        })

        // Act — only Get requests
        const result = yield* Effect.request(makeGetReq({ id: 'solo' }), resolver)

        // Assert
        expect(result).toEqual({ source: 'Get', id: 'solo' })
      }),
    )
  })
})

// Helpers

const makeGetReq = (fields: { id: string }): GetReq =>
  Request.of<GetReq>()({ _tag: 'Get' as const, ...fields })

const makeSearchReq = (fields: { query: string }): SearchReq =>
  Request.of<SearchReq>()({ _tag: 'Search' as const, ...fields })

const makeTestResolver = (handlers: {
  Get: (requests: readonly GetReq[]) => Effect.Effect<void>
  Search: (requests: readonly SearchReq[]) => Effect.Effect<void>
}): RequestResolver.RequestResolver<GetReq | SearchReq, never> =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- cast bridges WIP generic mismatch
  DiscriminatedRequestResolver.fromBatchedRunners(
    '_tag',
    ['Get', 'Search'] as const,
    handlers as any,
  ) as any

const makeTestResolverFromSubs = (resolvers: {
  Get: RequestResolver.RequestResolver<GetReq, never>
  Search: RequestResolver.RequestResolver<SearchReq, never>
}): RequestResolver.RequestResolver<GetReq | SearchReq, never> =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- cast bridges WIP generic mismatch
  DiscriminatedRequestResolver.fromRequestResolvers(
    '_tag',
    ['Get', 'Search'] as const,
    resolvers as any,
  ) as any

const expectFailure = (exit: Exit.Exit<unknown, unknown>) => {
  expect(Exit.isFailure(exit)).toBe(true)
}

const expectSuccess = (exit: Exit.Exit<unknown, unknown>): unknown => {
  if (!Exit.isSuccess(exit)) assert.fail('Expected success exit')
  return exit.value
}
