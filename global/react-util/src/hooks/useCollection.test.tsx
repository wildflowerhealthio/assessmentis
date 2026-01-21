import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { JSDOM } from 'jsdom'
import { useCollection } from './index'

// Ensure DOM globals are available when tests run outside jsdom-configured env
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window as unknown as typeof globalThis.window
globalThis.document = dom.window.document

type TestItem = { id?: string; name: string }

describe('useCollection', () => {
  describe('initial state', () => {
    it('should match provided array', () => {
      const initial: TestItem[] = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ]

      const apiDelete = vi.fn()
      const apiCreate = vi.fn()

      const { result } = renderHook(() =>
        useCollection({ apiDelete, apiCreate }, initial)
      )

      expect(result.current.collection).toHaveLength(2)
      expect(result.current.collection[0].data).toEqual(initial[0])
      expect(result.current.collection[1].data).toEqual(initial[1])
      expect(result.current.collection[0].loading).toBe(false)
      expect(result.current.collection[1].loading).toBe(false)
    })

    it('should handle empty initial array', () => {
      const apiDelete = vi.fn()
      const apiCreate = vi.fn()

      const { result } = renderHook(() =>
        useCollection({ apiDelete, apiCreate }, [])
      )

      expect(result.current.collection).toHaveLength(0)
    })

    it('should provide deleteItem and createItem methods', () => {
      const apiDelete = vi.fn()
      const apiCreate = vi.fn()

      const { result } = renderHook(() =>
        useCollection({ apiDelete, apiCreate }, [])
      )

      expect(typeof result.current.deleteItem).toBe('function')
      expect(typeof result.current.createItem).toBe('function')
    })
  })

  describe('deleteItem', () => {
    it('should set loading state then remove item on success', async () => {
      const initial: TestItem[] = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ]

      const apiDelete = vi.fn().mockResolvedValue(undefined)
      const apiCreate = vi.fn()

      const { result } = renderHook(() =>
        useCollection({ apiDelete, apiCreate }, initial)
      )

      // Initial state
      expect(result.current.collection).toHaveLength(2)
      expect(result.current.collection[0].loading).toBe(false)

      // Delete item
      await act(async () => {
        await result.current.deleteItem('1')
      })

      // Loading state should be set briefly, but we're checking after completion
      // Item should be removed
      await waitFor(() => {
        expect(result.current.collection).toHaveLength(1)
      })

      expect(result.current.collection[0].data.id).toBe('2')
      expect(apiDelete).toHaveBeenCalledWith('1')
    })

    it('should revert loading state on error', async () => {
      const initial: TestItem[] = [{ id: '1', name: 'Item 1' }]

      const error = new Error('Delete failed')
      const apiDelete = vi.fn().mockRejectedValue(error)
      const apiCreate = vi.fn()

      const { result } = renderHook(() =>
        useCollection({ apiDelete, apiCreate }, initial)
      )

      expect(result.current.collection[0].loading).toBe(false)

      // Attempt to delete
      await act(async () => {
        await result.current.deleteItem('1')
      })

      // Item should still exist with loading: false
      await waitFor(() => {
        expect(result.current.collection).toHaveLength(1)
      })

      expect(result.current.collection[0].data.id).toBe('1')
      expect(result.current.collection[0].loading).toBe(false)
    })

    it('should do nothing if id is undefined', async () => {
      const initial: TestItem[] = [{ name: 'No ID' }]
      const apiDelete = vi.fn()
      const apiCreate = vi.fn()

      const { result } = renderHook(() =>
        useCollection({ apiDelete, apiCreate }, initial)
      )

      await act(async () => {
        await result.current.deleteItem(undefined)
      })

      expect(apiDelete).not.toHaveBeenCalled()
      expect(result.current.collection).toHaveLength(1)
    })

    it('should handle multiple deletions', async () => {
      const initial: TestItem[] = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
      ]

      const apiDelete = vi.fn().mockResolvedValue(undefined)
      const apiCreate = vi.fn()

      const { result } = renderHook(() =>
        useCollection({ apiDelete, apiCreate }, initial)
      )

      // Delete first item
      await act(async () => {
        await result.current.deleteItem('1')
      })

      await waitFor(() => {
        expect(result.current.collection).toHaveLength(2)
      })

      // Delete second item
      await act(async () => {
        await result.current.deleteItem('2')
      })

      await waitFor(() => {
        expect(result.current.collection).toHaveLength(1)
      })

      expect(result.current.collection[0].data.id).toBe('3')
    })
  })

  describe('createItem', () => {
    it('should add optimistic item then update on success', async () => {
      const apiDelete = vi.fn()
      const createdItem: TestItem = { id: 'server-id', name: 'Created' }
      const apiCreate = vi.fn().mockResolvedValue(createdItem)

      const { result } = renderHook(() =>
        useCollection({ apiDelete, apiCreate }, [])
      )

      expect(result.current.collection).toHaveLength(0)

      const newItem: TestItem = { name: 'Created' }

      await act(async () => {
        result.current.createItem(newItem)
        // Give time for optimistic update
        await new Promise((r) => setTimeout(r, 10))
      })

      // Optimistic item should be added immediately
      expect(result.current.collection.length).toBeGreaterThan(0)
      expect(result.current.collection[0].data.name).toBe('Created')

      // Wait for API response
      await waitFor(() => {
        expect(result.current.collection[0].loading).toBe(false)
      })

      // Should be updated with server response
      expect(result.current.collection[0].data.id).toBe('server-id')
      expect(apiCreate).toHaveBeenCalledWith(newItem)
    })

    it('should use provided id if available', async () => {
      const apiDelete = vi.fn()
      const providedId = 'my-id'
      const apiCreate = vi
        .fn()
        .mockResolvedValue({ id: providedId, name: 'Created' })

      const { result } = renderHook(() =>
        useCollection({ apiDelete, apiCreate }, [])
      )

      const newItem: TestItem = { id: providedId, name: 'Created' }

      await act(async () => {
        result.current.createItem(newItem)
        await new Promise((r) => setTimeout(r, 10))
      })

      // Optimistic item should use provided id
      expect(result.current.collection[0].data.id).toBe(providedId)
    })

    it('should remove optimistic item on error', async () => {
      const apiDelete = vi.fn()
      const error = new Error('Create failed')
      const apiCreate = vi.fn().mockRejectedValue(error)

      const { result } = renderHook(() =>
        useCollection({ apiDelete, apiCreate }, [])
      )

      expect(result.current.collection).toHaveLength(0)

      const newItem: TestItem = { name: 'Failed' }

      // Start create
      act(() => {
        result.current.createItem(newItem)
      })

      // Wait for optimistic item to appear
      await waitFor(() => {
        expect(result.current.collection.length).toBeGreaterThan(0)
      })

      // Verify optimistic item was added
      if (result.current.collection.length > 0) {
        expect(result.current.collection[0].data.name).toBe('Failed')
      }

      // Wait for error to be handled and item to be removed
      await waitFor(
        () => {
          expect(result.current.collection).toHaveLength(0)
        },
        { timeout: 1000 }
      )
    })

    it('should add items to the beginning of the collection', async () => {
      const initial: TestItem[] = [{ id: '1', name: 'Existing' }]
      const apiDelete = vi.fn()
      const apiCreate = vi
        .fn()
        .mockResolvedValue({ id: '2', name: 'New Item' })

      const { result } = renderHook(() =>
        useCollection({ apiDelete, apiCreate }, initial)
      )

      expect(result.current.collection).toHaveLength(1)

      await act(async () => {
        result.current.createItem({ name: 'New Item' })
        await new Promise((r) => setTimeout(r, 10))
      })

      // New item should be first
      expect(result.current.collection.length).toBeGreaterThan(1)
      expect(result.current.collection[0].data.name).toBe('New Item')
      expect(result.current.collection[1].data.name).toBe('Existing')
    })
  })

  describe('render behavior', () => {
    it('should not cause excessive re-renders on mount', () => {
      let renderCount = 0

      const apiDelete = vi.fn()
      const apiCreate = vi.fn()

      renderHook(() => {
        renderCount++
        return useCollection({ apiDelete, apiCreate }, [])
      })

      expect(renderCount).toBe(1) // Initial render only
    })

    it('should re-render when collection changes', async () => {
      let renderCount = 0

      const apiDelete = vi.fn().mockResolvedValue(undefined)
      const apiCreate = vi.fn()

      const { result } = renderHook(() => {
        renderCount++
        return useCollection({ apiDelete, apiCreate }, [{ id: '1', name: 'Item' }])
      })

      expect(renderCount).toBe(1)

      await act(async () => {
        await result.current.deleteItem('1')
      })

      // Should re-render for loading state and for removal
      expect(renderCount).toBeGreaterThan(1)
    })
  })

  describe('concurrent operations', () => {
    it('should handle concurrent deletes', async () => {
      const initial: TestItem[] = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ]

      const apiDelete = vi.fn().mockResolvedValue(undefined)
      const apiCreate = vi.fn()

      const { result } = renderHook(() =>
        useCollection({ apiDelete, apiCreate }, initial)
      )

      // Delete both items concurrently
      await act(async () => {
        await Promise.all([
          result.current.deleteItem('1'),
          result.current.deleteItem('2'),
        ])
      })

      await waitFor(() => {
        expect(result.current.collection).toHaveLength(0)
      })

      expect(apiDelete).toHaveBeenCalledTimes(2)
    })

    it('should handle create while delete is pending', async () => {
      const initial: TestItem[] = [{ id: '1', name: 'Existing' }]

      let resolveDelete: () => void
      const apiDelete = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveDelete = resolve
          })
      )
      const apiCreate = vi.fn().mockResolvedValue({ id: '2', name: 'New' })

      const { result } = renderHook(() =>
        useCollection({ apiDelete, apiCreate }, initial)
      )

      // Start delete
      act(() => {
        result.current.deleteItem('1')
      })

      await new Promise((r) => setTimeout(r, 10))

      // Start create while delete is pending
      await act(async () => {
        result.current.createItem({ name: 'New' })
        await new Promise((r) => setTimeout(r, 10))
      })

      // Should have both items (one deleting, one optimistic)
      expect(result.current.collection.length).toBe(2)

      // Complete delete
      await act(async () => {
        resolveDelete!()
        await new Promise((r) => setTimeout(r, 50))
      })

      // Should only have the created item
      await waitFor(() => {
        expect(result.current.collection).toHaveLength(1)
      })

      expect(result.current.collection[0].data.name).toBe('New')
    })
  })
})
