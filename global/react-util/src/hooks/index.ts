import { type RefObject, useEffect, useState } from 'react'
import { useStatePromise } from './effectHooks'

export * from './effectHooks'
export * from './useStream'
export * from './useLoadingPromise'
export * from './usePromiseOrDefault'

export const useCollection = <T>(
  {
    apiDelete,
    apiCreate,
  }: {
    apiDelete: (key: string) => Promise<unknown>
    apiCreate: (value: T) => Promise<T>
  },
  initial: ReadonlyArray<T>,
  keyOf: (item: T) => string | undefined = () => undefined
) => {
  const [collection, setCollection] = useState<
    ReadonlyArray<{ data: T; loading: boolean }>
  >(initial.map((item) => ({ data: item, loading: false })))
  const { deleteItem, createItem } = collectionMethods<T>(
    { apiDelete, apiCreate },
    (f) => setCollection((c) => f(c)),
    keyOf
  )

  return { collection, deleteItem, createItem }
}

export const useCollectionPromise = <T>(
  {
    apiDelete,
    apiCreate,
  }: {
    apiDelete: (key: string) => Promise<unknown>
    apiCreate: (value: T) => Promise<T>
  },
  initial: Promise<ReadonlyArray<T>>,
  keyOf: (item: T) => string | undefined = () => undefined
) => {
  const [collectionPromise, methods] = useStatePromise<
    ReadonlyArray<{
      data: T
      loading: boolean
    }>
  >()

  useEffect(() => {
    initial
      .then((items) =>
        methods.resolve(items.map((item) => ({ data: item, loading: false })))
      )
      .catch((err) => methods.reject(err))
  }, [initial, methods])

  const { deleteItem, createItem } = collectionMethods<T>(
    { apiDelete, apiCreate },
    methods.map,
    keyOf
  )

  return { collectionPromise, deleteItem, createItem }
}

function collectionMethods<T>(
  {
    apiDelete,
    apiCreate,
  }: {
    apiDelete: (key: string) => Promise<unknown>
    apiCreate: (value: T) => Promise<T>
  },
  updateCache: (
    f: (
      t: ReadonlyArray<{
        data: T
        loading: boolean
      }>
    ) => ReadonlyArray<{
      data: T
      loading: boolean
    }>
  ) => void,
  keyOf: (item: T) => string | undefined
) {
  const deleteItem = async (key: string | undefined) => {
    if (!key) return
    updateCache((current) =>
      current.map((item) =>
        keyOf(item.data) === key ? { ...item, loading: true } : item
      )
    )
    await apiDelete(key)
      .then(() =>
        updateCache((current) =>
          current.filter((item) => keyOf(item.data) !== key)
        )
      )
      .catch(() =>
        updateCache((current) =>
          current.map((item) =>
            keyOf(item.data) === key ? { ...item, loading: false } : item
          )
        )
      )
  }

  const createItem = async (t: T) => {
    updateCache((current) => [{ data: t, loading: true }, ...current])
    apiCreate(t)
      .then((created) =>
        updateCache((current) => {
          // Find the first loading item that matches the temp key or doesn't have a key
          // (the optimistic entry we just inserted)
          let found = false
          return current.map((item) => {
            if (!found && item.loading && keyOf(item.data) === keyOf(t)) {
              found = true
              return { data: created, loading: false }
            }
            return item
          })
        })
      )
      .catch(() =>
        updateCache((current) => {
          let found = false
          return current.filter((item) => {
            if (!found && item.loading && keyOf(item.data) === keyOf(t)) {
              found = true
              return false
            }
            return true
          })
        })
      )
  }
  return { deleteItem, createItem }
}

export const useOutsideClickHandler = (
  ref: RefObject<Node | null>,
  handler: () => void
) => {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target instanceof Node)) return

      if (ref.current != null && !ref.current.contains(event.target)) {
        handler()
      }
    }
    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref, handler])
}
