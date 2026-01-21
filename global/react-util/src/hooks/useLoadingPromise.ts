import { useEffect, useState } from 'react'

export type LoadingPromiseState<T> =
  | { value: T; loading: false; error: undefined }
  | { value: undefined; loading: true; error: undefined }
  | { value: undefined; loading: false; error: unknown }

export function useLoadingPromise<T>(
  value: Promise<T>
): LoadingPromiseState<T> {
  const [state, setState] = useState<LoadingPromiseState<T>>({
    value: undefined,
    loading: true,
    error: undefined,
  })

  useEffect(() => {
    let isMounted = true
    value
      .then((resolvedValue) => {
        if (isMounted) {
          setState({ value: resolvedValue, loading: false, error: undefined })
        }
      })
      .catch((err) => {
        if (isMounted) {
          setState({ value: undefined, loading: false, error: err })
        }
      })
    return () => {
      isMounted = false
      setState({ value: undefined, loading: true, error: undefined })
    }
  }, [value])

  return state
}
