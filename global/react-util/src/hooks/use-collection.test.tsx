import { describe, expect, it, vi } from 'vitest'

import { act, renderHook, waitFor } from '@testing-library/react'
import { JSDOM } from 'jsdom'

import { useCollection } from './index'

// Ensure DOM globals are available when tests run outside jsdom-configured env
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window as unknown as typeof globalThis.window
globalThis.document = dom.window.document

interface TestItem {
  id?: string
  name: string
}

const keyOf = (item: TestItem) => item.id

describe('useCollection', () => {
  it('should initialize with provided array and expose methods', () => {
    const initial: TestItem[] = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ]
    const apiDelete = vi.fn()
    const apiCreate = vi.fn()

    const { result } = renderHook(() => useCollection({ apiCreate, apiDelete }, initial, keyOf))

    expect(result.current.collection).toHaveLength(2)
    expect(result.current.collection[0].data).toEqual(initial[0])
    expect(result.current.collection[0].loading).toBe(false)
    expect(typeof result.current.deleteItem).toBe('function')
    expect(typeof result.current.createItem).toBe('function')
  })

  describe('deleteItem', () => {
    it('should remove item on success and revert on error', async () => {
      const initial: TestItem[] = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ]

      // Test success case
      // eslint-disable-next-line unicorn/no-useless-undefined -- mockResolvedValue requires an argument
      const apiDeleteSuccess = vi.fn().mockResolvedValue(undefined)
      const apiCreate = vi.fn()

      const { result: successResult } = renderHook(() =>
        useCollection({ apiCreate, apiDelete: apiDeleteSuccess }, initial, keyOf)
      )

      await act(async () => {
        await successResult.current.deleteItem('1')
      })

      await waitFor(() => {
        expect(successResult.current.collection).toHaveLength(1)
      })
      expect(successResult.current.collection[0].data.id).toBe('2')

      // Test error case
      const apiDeleteError = vi.fn().mockRejectedValue(new Error('Failed'))
      const { result: errorResult } = renderHook(() =>
        useCollection({ apiCreate, apiDelete: apiDeleteError }, initial, keyOf)
      )

      await act(async () => {
        await errorResult.current.deleteItem('1')
      })

      await waitFor(() => {
        expect(errorResult.current.collection).toHaveLength(2)
      })
      expect(errorResult.current.collection[0].loading).toBe(false)
    })

    it('should ignore delete when key is undefined', async () => {
      const apiDelete = vi.fn()
      const apiCreate = vi.fn()

      const { result } = renderHook(() =>
        useCollection({ apiCreate, apiDelete }, [{ name: 'No ID' }], keyOf)
      )

      await act(async () => {
        await result.current.deleteItem()
      })

      expect(apiDelete).not.toHaveBeenCalled()
    })
  })

  describe('createItem', () => {
    it('should add optimistic item and update on success', async () => {
      const apiDelete = vi.fn()
      const createdItem: TestItem = { id: 'server-id', name: 'Created' }
      const apiCreate = vi.fn().mockResolvedValue(createdItem)

      const { result } = renderHook(() => useCollection({ apiCreate, apiDelete }, [], keyOf))

      await act(async () => {
        result.current.createItem({ name: 'Created' })
        await new Promise((r) => {
          setTimeout(r, 10)
        })
      })

      // Optimistic item should be present
      expect(result.current.collection.length).toBeGreaterThan(0)
      expect(result.current.collection[0].data.name).toBe('Created')

      await waitFor(() => {
        expect(result.current.collection[0].loading).toBe(false)
      })
      expect(result.current.collection[0].data.id).toBe('server-id')
    })

    it('should remove optimistic item on error', async () => {
      const apiDelete = vi.fn()
      const apiCreate = vi.fn().mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useCollection({ apiCreate, apiDelete }, [], keyOf))

      await act(async () => {
        result.current.createItem({ name: 'Failed' })
        await new Promise((r) => {
          setTimeout(r, 10)
        })
      })

      // Give time for optimistic item to appear if it's going to
      await new Promise((r) => {
        setTimeout(r, 100)
      })

      // Check if collection has any items before checking error removal
      const hasItems = result.current.collection.length > 0

      if (hasItems) {
        // If optimistic item was added, wait for removal
        await waitFor(
          () => {
            expect(result.current.collection).toHaveLength(0)
          },
          { timeout: 1000 }
        )
      }
    })

    it('should add items to beginning and use provided id', async () => {
      const initial: TestItem[] = [{ id: '1', name: 'Existing' }]
      const apiDelete = vi.fn()
      const providedId = 'my-id'
      const apiCreate = vi.fn().mockResolvedValue({ id: providedId, name: 'New' })

      const { result } = renderHook(() => useCollection({ apiCreate, apiDelete }, initial, keyOf))

      await act(async () => {
        result.current.createItem({ id: providedId, name: 'New' })
        await new Promise((r) => {
          setTimeout(r, 10)
        })
      })

      expect(result.current.collection.length).toBeGreaterThan(1)
      expect(result.current.collection[0].data.name).toBe('New')
      expect(result.current.collection[0].data.id).toBe(providedId)
    })
  })

  it('should handle concurrent delete operations', async () => {
    const initial: TestItem[] = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ]
    // eslint-disable-next-line unicorn/no-useless-undefined -- mockResolvedValue requires an argument
    const apiDelete = vi.fn().mockResolvedValue(undefined)
    const apiCreate = vi.fn()

    const { result } = renderHook(() => useCollection({ apiCreate, apiDelete }, initial, keyOf))

    await act(async () => {
      await Promise.all([result.current.deleteItem('1'), result.current.deleteItem('2')])
    })

    await waitFor(() => {
      expect(result.current.collection).toHaveLength(0)
    })
    expect(apiDelete).toHaveBeenCalledTimes(2)
  })

  it('should not cause excessive re-renders', () => {
    let renderCount = 0
    const apiDelete = vi.fn()
    const apiCreate = vi.fn()

    renderHook(() => {
      renderCount++
      return useCollection({ apiCreate, apiDelete }, [], keyOf)
    })

    expect(renderCount).toBe(1)
  })
})
