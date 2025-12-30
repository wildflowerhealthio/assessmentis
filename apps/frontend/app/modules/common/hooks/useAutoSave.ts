import { useEffect, useRef } from 'react'

export interface UseAutoSaveOptions<T> {
  /**
   * The data to auto-save
   */
  data: T
  /**
   * Function to call when saving
   * Should return a Promise that resolves when save is complete
   */
  onSave: (data: T) => Promise<void>
  /**
   * Delay in milliseconds before triggering auto-save after data changes
   * @default 5000 (5 seconds)
   */
  delay?: number
  /**
   * Whether auto-save is enabled
   * @default true
   */
  enabled?: boolean
}

/**
 * Custom hook for auto-saving data with debouncing
 *
 * @example
 * ```tsx
 * useAutoSave({
 *   data: formData,
 *   onSave: async (data) => {
 *     await saveToServer(data)
 *   },
 *   delay: 5000,
 * })
 * ```
 */
export function useAutoSave<T>({
  data,
  onSave,
  delay = 5000,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSaveRef = useRef(onSave)

  // Keep the latest onSave callback in a ref to avoid dependency issues
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  useEffect(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // If auto-save is disabled, don't set up a new timeout
    if (!enabled) {
      return
    }

    // Set up new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      onSaveRef.current(data).catch((err) => {
        console.error('Auto-save failed:', err)
      })
    }, delay)

    // Cleanup function to clear timeout
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, delay, enabled])
}
