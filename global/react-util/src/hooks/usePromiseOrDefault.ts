import { useEffect, useState } from 'react'

export const usePromiseOrDefault = <T>(
  promise: Promise<T>,
  defaultValue: T
): T => {
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    promise
      .then((result) => {
        setValue(result)
      })
      .catch(() => {
        setValue(defaultValue)
      })
    return () => {
      setValue(defaultValue)
    }
  }, [promise, defaultValue])

  return value
}
