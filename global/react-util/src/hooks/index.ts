import { RefObject, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

export const useCollection = <
  Id extends string,
  T extends { id?: Id | undefined },
>(
  {
    apiDelete,
    apiCreate,
  }: {
    apiDelete: (id: Id) => Promise<unknown>
    apiCreate: (value: T) => Promise<T>
  },
  initial: T[]
) => {
  const [collection, setCollection] = useState(
    initial.map((item) => ({ data: item, loading: false }))
  )
  const deleteItem = async (id: Id | undefined) => {
    if (!id) return
    setCollection((current) =>
      current.map((item) =>
        item.data.id === id ? { ...item, loading: true } : item
      )
    )
    await apiDelete(id)
      .then(() =>
        setCollection((current) =>
          current.filter((item) => item.data.id !== id)
        )
      )
      .catch(() =>
        setCollection((current) =>
          current.map((item) =>
            item.data.id === id ? { ...item, loading: false } : item
          )
        )
      )
  }

  const createItem = async (t: T) => {
    const id = t.id ?? uuidv4()
    setCollection((current) => [
      { data: { ...t, id }, loading: true },
      ...current,
    ])
    apiCreate(t)
      .then((created) =>
        setCollection((current) =>
          current.map((item) =>
            item.data.id === id
              ? { ...item, data: created, loading: false }
              : item
          )
        )
      )
      .catch(() =>
        setCollection((current) =>
          current.filter((item) => item.data.id !== id)
        )
      )
  }
  return { collection, deleteItem, createItem }
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
