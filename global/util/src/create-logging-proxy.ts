import { isPromiseLike } from 'effect/Predicate'

/** The result of a synchronous method call on a logging proxy. */
export interface SyncCallLog {
  readonly method: string
  readonly args: readonly unknown[]
  readonly result: unknown
}

/** The result of a resolved async method call on a logging proxy. */
export interface AsyncResolvedLog {
  readonly method: string
  readonly args: readonly unknown[]
  readonly resolved: unknown
}

/** The result of a rejected async method call on a logging proxy. */
export interface AsyncRejectedLog {
  readonly method: string
  readonly args: readonly unknown[]
  readonly error: unknown
}

/** A log entry emitted by {@link createLoggingProxy}. */
export type MethodCallLog = SyncCallLog | AsyncResolvedLog | AsyncRejectedLog

/**
 * Wraps an object in a `Proxy` that logs every method call via a
 * caller-supplied callback.
 *
 * @typeParam T - The type of the object being proxied
 * @param target - The object whose method calls should be logged
 * @param log - Callback invoked with a {@link MethodCallLog} for each call.
 *   For async methods (those returning a thenable), the callback fires
 *   after the promise settles, not when the method is invoked.
 * @returns A proxy with the same interface as `target`
 *
 * @remarks
 * The proxy intercepts property access: when the accessed value is a
 * function it wraps the call so that arguments and return values are
 * forwarded to `log`. Non-function properties pass through unchanged.
 *
 * The `ProxyHandler` uses `any` because the ES `Proxy` API is
 * inherently untyped at the handler level — this is one of the narrow
 * exceptions documented in the project rules.
 *
 * This utility is pure: it takes a logger function rather than
 * hardcoding `console.log`, so it can live in a domain-safe package.
 *
 * @example
 * ```ts
 * const logged = createLoggingProxy(myClient, (entry) => console.log(entry))
 * logged.search('Patient') // logs { method: 'search', args: ['Patient'], ... }
 * ```
 */
export const createLoggingProxy = <T extends object>(
  target: T,
  log: (entry: MethodCallLog) => void
): T => {
  // ProxyHandler is inherently generic — the ES Proxy API types its
  // Trap parameters as `any`. This is a narrow, documented exception
  // To the project's no-`any` rule.
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  const handler: ProxyHandler<any> = {
    get(proxyTarget, prop, receiver) {
      const value = proxyTarget[prop]
      if (typeof value !== 'function') {
        return value
      }

      // oxlint-disable-next-line @typescript-eslint/no-explicit-any
      return function get(this: unknown, ...args: any[]) {
        // oxlint-disable-next-line typescript/no-this-alias
        let context: unknown = this
        if (this === receiver) {
          context = proxyTarget
        }
        const result = value.apply(context, args)
        const method = String(prop)

        if (isPromiseLike(result)) {
          result.then(
            (resolved) => {
              log({ args, method, resolved })
            },
            (error) => {
              log({ args, error, method })
            }
          )
        } else {
          log({ args, method, result })
        }

        return result
      }
    },
  }

  return new Proxy(target, handler)
}
