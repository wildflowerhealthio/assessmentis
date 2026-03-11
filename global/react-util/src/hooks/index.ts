import { type RefObject, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useStatePromise } from './effectHooks'

export * from './effectHooks'
export * from './useStream'
export * from './useLoadingPromise'
export * from './usePromiseOrDefault'

/**
 * Manages an optimistic CRUD collection backed by API calls. Items are
 * shown immediately with `loading: true` during create/delete, then
 * updated or removed when the API responds. Rolls back on failure.
 *
 * @returns `{ collection, deleteItem, createItem }`
 */
export const useCollection = <T extends { id?: string | undefined }>(
  {
    apiDelete,
    apiCreate,
  }: {
    apiDelete: (id: NonNullable<T['id']>) => Promise<unknown>
    apiCreate: (value: T) => Promise<T>
  },
  initial: ReadonlyArray<T>
) => {
  const [collection, setCollection] = useState<
    ReadonlyArray<{ data: T; loading: boolean }>
  >(initial.map((item) => ({ data: item, loading: false })))
  const { deleteItem, createItem } = collectionMethods<T>(
    { apiDelete, apiCreate },
    (f) => setCollection((c) => f(c))
  )

  return { collection, deleteItem, createItem }
}

/**
 * Like {@link useCollection} but accepts a `Promise<ReadonlyArray<T>>`
 * for the initial data. Returns a promise-based collection that resolves
 * once the initial data loads.
 */
export const useCollectionPromise = <T extends { id?: string | undefined }>(
  {
    apiDelete,
    apiCreate,
  }: {
    apiDelete: (id: NonNullable<T['id']>) => Promise<unknown>
    apiCreate: (value: T) => Promise<T>
  },
  initial: Promise<ReadonlyArray<T>>
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
    methods.map
  )

  return { collectionPromise, deleteItem, createItem }
}

/** Shared optimistic create/delete logic used by both `useCollection` and `useCollectionPromise`. */
function collectionMethods<T extends { id?: string | undefined }>(
  {
    apiDelete,
    apiCreate,
  }: {
    apiDelete: (id: NonNullable<T['id']>) => Promise<unknown>
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
  ) => void
) {
  const deleteItem = async (id: T['id']) => {
    if (!id) return
    updateCache((current) =>
      current.map((item) =>
        item.data.id === id ? { ...item, loading: true } : item
      )
    )
    await apiDelete(id)
      .then(() =>
        updateCache((current) => current.filter((item) => item.data.id !== id))
      )
      .catch(() =>
        updateCache((current) =>
          current.map((item) =>
            item.data.id === id ? { ...item, loading: false } : item
          )
        )
      )
  }

  const createItem = async (t: T) => {
    const id = t.id ?? uuidv4()
    updateCache((current) => [
      { data: { ...t, id }, loading: true },
      ...current,
    ])
    apiCreate(t)
      .then((created) =>
        updateCache((current) =>
          current.map((item) =>
            item.data.id === id
              ? { ...item, data: created, loading: false }
              : item
          )
        )
      )
      .catch(() =>
        updateCache((current) => current.filter((item) => item.data.id !== id))
      )
  }
  return { deleteItem, createItem }
}

/**
 * Calls `handler` when a mousedown event occurs outside the element
 * referenced by `ref`. Commonly used to close dropdowns/modals on
 * outside click.
 */
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
