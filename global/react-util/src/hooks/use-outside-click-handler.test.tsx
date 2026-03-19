import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { renderHook } from '@testing-library/react'
import { JSDOM } from 'jsdom'

import { useOutsideClickHandler } from './index'

// Ensure DOM globals are available when tests run outside jsdom-configured env
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window as unknown as typeof globalThis.window
globalThis.document = dom.window.document
const { MouseEvent } = dom.window

describe('useOutsideClickHandler', () => {
  it('should not call handler when clicking inside ref or child elements', () => {
    const handler = vi.fn()
    const ref = createRef<HTMLDivElement>()

    const refElement = document.createElement('div')
    document.body.append(refElement)
    Object.defineProperty(ref, 'current', {
      value: refElement,
      writable: true,
    })

    renderHook(() => {
      useOutsideClickHandler(ref, handler)
    })

    // Click inside - should not call handler
    refElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
    expect(handler).not.toHaveBeenCalled()

    // Click on child element - should not call handler
    const childElement = document.createElement('span')
    refElement.append(childElement)
    childElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
    expect(handler).not.toHaveBeenCalled()

    refElement.remove()
  })

  it('should handle null ref and non-Node targets without errors', () => {
    const handler = vi.fn()
    const ref = createRef<HTMLDivElement>()

    renderHook(() => {
      useOutsideClickHandler(ref, handler)
    })

    // Click when ref is null - should not call handler
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
    expect(handler).not.toHaveBeenCalled()

    // Non-Node target should not throw
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    })
    Object.defineProperty(event, 'target', {
      value: 'not a node',
      writable: false,
    })
    expect(() => document.dispatchEvent(event)).not.toThrow()
    expect(handler).not.toHaveBeenCalled()
  })

  it('should add listener on mount and remove on unmount, without calling handler after unmount', () => {
    const handler = vi.fn()
    const ref = createRef<HTMLDivElement>()
    const refElement = document.createElement('div')
    document.body.append(refElement)
    Object.defineProperty(ref, 'current', {
      value: refElement,
      writable: true,
    })

    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = renderHook(() => {
      useOutsideClickHandler(ref, handler)
    })

    expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))

    unmount()

    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))

    // Verify handler not called after unmount
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
    expect(handler).not.toHaveBeenCalled()

    addSpy.mockRestore()
    removeSpy.mockRestore()
    refElement.remove()
  })
})
