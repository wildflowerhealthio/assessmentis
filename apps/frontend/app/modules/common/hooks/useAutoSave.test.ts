import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderHook } from '@testing-library/react'

import { useAutoSave } from './useAutoSave'

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should call onSave after the specified delay', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const data = { test: 'value' }

    renderHook(() =>
      useAutoSave({
        data,
        onSave,
        delay: 5000,
      })
    )

    // Should not call immediately
    expect(onSave).not.toHaveBeenCalled()

    // Fast-forward time by 5 seconds
    vi.advanceTimersByTime(5000)

    // Run pending promises
    await vi.runOnlyPendingTimersAsync()

    expect(onSave).toHaveBeenCalledWith(data)
  })

  it('should use default delay of 5000ms when not specified', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const data = { test: 'value' }

    renderHook(() =>
      useAutoSave({
        data,
        onSave,
      })
    )

    // Fast-forward by 4999ms - should not call yet
    vi.advanceTimersByTime(4999)
    expect(onSave).not.toHaveBeenCalled()

    // Fast-forward by 1ms more - should call now
    vi.advanceTimersByTime(1)

    // Run pending promises
    await vi.runOnlyPendingTimersAsync()

    expect(onSave).toHaveBeenCalledWith(data)
  })

  it('should debounce when data changes rapidly', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)

    const { rerender } = renderHook(
      ({ data }) =>
        useAutoSave({
          data,
          onSave,
          delay: 5000,
        }),
      { initialProps: { data: { test: 'value1' } } }
    )

    // Fast-forward by 2 seconds
    vi.advanceTimersByTime(2000)

    // Update data
    rerender({ data: { test: 'value2' } })

    // Fast-forward by 3 more seconds (total 5 from start, but only 3 from last change)
    vi.advanceTimersByTime(3000)

    // Should not have been called yet (need 5s from last change)
    expect(onSave).not.toHaveBeenCalled()

    // Fast-forward by 2 more seconds (5s from last change)
    vi.advanceTimersByTime(2000)

    // Run pending promises
    await vi.runOnlyPendingTimersAsync()

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({ test: 'value2' })
  })

  it('should not call onSave when enabled is false', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const data = { test: 'value' }

    renderHook(() =>
      useAutoSave({
        data,
        onSave,
        delay: 5000,
        enabled: false,
      })
    )

    // Fast-forward time
    vi.advanceTimersByTime(10000)

    // Should not have been called
    expect(onSave).not.toHaveBeenCalled()
  })

  it('should handle save errors gracefully', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const error = new Error('Save failed')
    const onSave = vi.fn().mockRejectedValue(error)
    const data = { test: 'value' }

    renderHook(() =>
      useAutoSave({
        data,
        onSave,
        delay: 1000,
      })
    )

    vi.advanceTimersByTime(1000)

    // Run pending promises
    await vi.runOnlyPendingTimersAsync()

    expect(onSave).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith('Auto-save failed:', error)

    consoleErrorSpy.mockRestore()
  })

  it('should cancel pending save when data changes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)

    const { rerender } = renderHook(
      ({ data }) =>
        useAutoSave({
          data,
          onSave,
          delay: 5000,
        }),
      { initialProps: { data: { test: 'value1' } } }
    )

    // Fast-forward by 4 seconds
    vi.advanceTimersByTime(4000)

    // Update data (should cancel the previous timeout)
    rerender({ data: { test: 'value2' } })

    // Fast-forward by 1 second (would have triggered the old timeout)
    vi.advanceTimersByTime(1000)

    // Should not have been called yet
    expect(onSave).not.toHaveBeenCalled()

    // Fast-forward by 4 more seconds (5s from last change)
    vi.advanceTimersByTime(4000)

    // Run pending promises
    await vi.runOnlyPendingTimersAsync()

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({ test: 'value2' })
  })

  it('should cleanup timeout on unmount', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const data = { test: 'value' }

    const { unmount } = renderHook(() =>
      useAutoSave({
        data,
        onSave,
        delay: 5000,
      })
    )

    // Fast-forward by 3 seconds
    vi.advanceTimersByTime(3000)

    // Unmount the hook
    unmount()

    // Fast-forward by 3 more seconds (would have triggered if not unmounted)
    vi.advanceTimersByTime(3000)

    // Should not have been called
    expect(onSave).not.toHaveBeenCalled()
  })

  it('should use the latest onSave callback when it changes', async () => {
    // Track which version of the callback was called
    const calls: string[] = []
    const onSave1 = vi.fn().mockImplementation(async () => {
      calls.push('callback1')
    })
    const onSave2 = vi.fn().mockImplementation(async () => {
      calls.push('callback2')
    })

    const data = { test: 'value' }

    const { rerender } = renderHook(
      ({ callback }) =>
        useAutoSave({
          data,
          onSave: callback,
          delay: 5000,
        }),
      { initialProps: { callback: onSave1 } }
    )

    // Fast-forward by 3 seconds (not enough to trigger)
    vi.advanceTimersByTime(3000)

    // Change the callback before the timeout fires
    rerender({ callback: onSave2 })

    // Fast-forward by the remaining 2 seconds to trigger the save
    vi.advanceTimersByTime(2000)

    // Run pending promises
    await vi.runOnlyPendingTimersAsync()

    // The second callback should have been called, not the first
    expect(onSave1).not.toHaveBeenCalled()
    expect(onSave2).toHaveBeenCalledWith(data)
    expect(calls).toEqual(['callback2'])
  })

  it('should skip auto-save on initial mount when skipInitialSave is true', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const data = { test: 'initialValue' }

    const { rerender } = renderHook(
      ({ data }) =>
        useAutoSave({
          data,
          onSave,
          delay: 1000,
          skipInitialSave: true,
        }),
      { initialProps: { data } }
    )

    // Fast-forward past the delay on initial mount
    vi.advanceTimersByTime(1000)
    await vi.runOnlyPendingTimersAsync()

    // Should not have been called on initial mount
    expect(onSave).not.toHaveBeenCalled()

    // Now change the data
    rerender({ data: { test: 'updatedValue' } })

    // Fast-forward past the delay
    vi.advanceTimersByTime(1000)
    await vi.runOnlyPendingTimersAsync()

    // Should now be called with the updated data
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({ test: 'updatedValue' })
  })

  it('should trigger auto-save on initial mount when skipInitialSave is false (default)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const data = { test: 'initialValue' }

    renderHook(() =>
      useAutoSave({
        data,
        onSave,
        delay: 1000,
      })
    )

    // Fast-forward past the delay on initial mount
    vi.advanceTimersByTime(1000)
    await vi.runOnlyPendingTimersAsync()

    // Should have been called on initial mount
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith(data)
  })
})
