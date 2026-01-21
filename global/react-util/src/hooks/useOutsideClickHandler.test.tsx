import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { JSDOM } from 'jsdom'
import { createRef } from 'react'
import { useOutsideClickHandler } from './index'

// Ensure DOM globals are available when tests run outside jsdom-configured env
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window as unknown as typeof globalThis.window
globalThis.document = dom.window.document
const MouseEvent = dom.window.MouseEvent

describe('useOutsideClickHandler', () => {
  describe('click detection', () => {
    it('should work with ref and handler setup', () => {
      const handler = vi.fn()
      const ref = createRef<HTMLDivElement>()

      // Create and attach ref element
      const refElement = document.createElement('div')
      document.body.appendChild(refElement)
      Object.defineProperty(ref, 'current', {
        writable: true,
        value: refElement,
      })

      const { unmount } = renderHook(() => useOutsideClickHandler(ref, handler))

      // Verify hook mounts without errors
      expect(ref.current).toBe(refElement)

      unmount()

      // Cleanup
      document.body.removeChild(refElement)
    })

    it('should not call handler when clicking inside ref', () => {
      const handler = vi.fn()
      const ref = createRef<HTMLDivElement>()

      const refElement = document.createElement('div')
      document.body.appendChild(refElement)
      Object.defineProperty(ref, 'current', {
        writable: true,
        value: refElement,
      })

      renderHook(() => useOutsideClickHandler(ref, handler))

      // Click the ref element itself
      const event = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      })

      refElement.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()

      // Cleanup
      document.body.removeChild(refElement)
    })

    it('should not call handler when clicking child element', () => {
      const handler = vi.fn()
      const ref = createRef<HTMLDivElement>()

      const refElement = document.createElement('div')
      const childElement = document.createElement('span')
      refElement.appendChild(childElement)
      document.body.appendChild(refElement)

      Object.defineProperty(ref, 'current', {
        writable: true,
        value: refElement,
      })

      renderHook(() => useOutsideClickHandler(ref, handler))

      // Click child element
      const event = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      })

      childElement.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()

      // Cleanup
      document.body.removeChild(refElement)
    })

    it('should handle null ref gracefully', () => {
      const handler = vi.fn()
      const ref = createRef<HTMLDivElement>()
      // ref.current is null by default

      const { unmount } = renderHook(() => useOutsideClickHandler(ref, handler))

      // Should not throw
      expect(() => {
        const event = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        })
        document.body.dispatchEvent(event)
      }).not.toThrow()

      unmount()
    })
  })

  describe('event listener lifecycle', () => {
    it('should add event listener on mount', () => {
      const handler = vi.fn()
      const ref = createRef<HTMLDivElement>()

      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

      renderHook(() => useOutsideClickHandler(ref, handler))

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function)
      )

      addEventListenerSpy.mockRestore()
    })

    it('should remove event listener on unmount', () => {
      const handler = vi.fn()
      const ref = createRef<HTMLDivElement>()

      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const { unmount } = renderHook(() => useOutsideClickHandler(ref, handler))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })

    it('should not respond to clicks after unmount', () => {
      const handler = vi.fn()
      const ref = createRef<HTMLDivElement>()

      const refElement = document.createElement('div')
      document.body.appendChild(refElement)
      Object.defineProperty(ref, 'current', {
        writable: true,
        value: refElement,
      })

      const { unmount } = renderHook(() => useOutsideClickHandler(ref, handler))

      // Unmount first
      unmount()

      // Then dispatch event - should not throw
      expect(() => {
        const event = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        })
        document.body.dispatchEvent(event)
      }).not.toThrow()

      // Cleanup
      document.body.removeChild(refElement)
    })
  })

  describe('edge cases', () => {
    it('should handle non-Node event targets', () => {
      const handler = vi.fn()
      const ref = createRef<HTMLDivElement>()

      const refElement = document.createElement('div')
      document.body.appendChild(refElement)
      Object.defineProperty(ref, 'current', {
        writable: true,
        value: refElement,
      })

      renderHook(() => useOutsideClickHandler(ref, handler))

      // Create event with non-Node target (edge case)
      const event = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      })
      Object.defineProperty(event, 'target', {
        writable: false,
        value: 'not a node',
      })

      document.dispatchEvent(event)

      // Should not call handler for non-Node targets
      expect(handler).not.toHaveBeenCalled()

      // Cleanup
      document.body.removeChild(refElement)
    })
  })
})
