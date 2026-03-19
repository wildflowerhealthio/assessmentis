import { useEffect, useState } from 'react'

/**
 * Returns `defaultValue` while `promise` is pending, then the resolved
 * value once settled. Reverts to `defaultValue` on rejection or when
 * the promise reference changes.
 */
export const usePromiseOrDefault = <T>(promise: Promise<T>, defaultValue: T): T => {
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    promise
      .then((result) => {
        setValue(result)
      })
      .catch(() => {
        setValue(defaultValue)
      })
    return (): void => {
      setValue(defaultValue)
    }
  }, [promise, defaultValue])

  return value
}
