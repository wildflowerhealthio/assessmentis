import { useEffect, useState } from 'react'

/**
 * Discriminated union representing the three states of a tracked promise:
 * loading, resolved (with `value`), or rejected (with `error`).
 */
export type LoadingPromiseState<T> =
  | { value: T; loading: false; error: undefined }
  | { value: undefined; loading: true; error: undefined }
  | { value: undefined; loading: false; error: unknown }

/**
 * Tracks a `Promise<T>` as React state, returning a {@link LoadingPromiseState}
 * that transitions through loading → loaded/error. Resets to loading when
 * the promise reference changes; ignores stale settlements after unmount.
 */
export function useLoadingPromise<T>(value: Promise<T>): LoadingPromiseState<T> {
  const [state, setState] = useState<LoadingPromiseState<T>>({
    error: undefined,
    loading: true,
    value: undefined,
  })

  useEffect(() => {
    let isMounted = true
    value
      .then((resolvedValue) => {
        if (isMounted) {
          setState({ error: undefined, loading: false, value: resolvedValue })
        }
      })
      .catch((error) => {
        if (isMounted) {
          setState({ value: undefined, loading: false, error: error })
        }
      })
    return (): void => {
      isMounted = false
      setState({ error: undefined, loading: true, value: undefined })
    }
  }, [value])

  return state
}
