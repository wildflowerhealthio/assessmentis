/**
 * Options for {@link safeDebugString}.
 */
export interface SafeDebugStringOptions {
  /** Maximum character length before truncation (default: 2000). */
  maxLength?: number
  /** Number of spaces for JSON indentation (default: 2). */
  indent?: number
}

/**
 * Safely converts an unknown value to a human-readable debug string.
 *
 * @param value - The value to represent as a debug string
 * @param options - Optional configuration for the output
 * @returns A string representation suitable for error messages and logging
 *
 * @remarks
 * Handles cases that `JSON.stringify` does not:
 * - **Circular references** are replaced with `"[Circular]"` instead of throwing
 * - **BigInt values** are rendered as `"<BigInt: 42n>"` instead of throwing
 * - **Very large output** is truncated to `maxLength` with a `... [truncated]` suffix
 * - **`undefined`** renders as `"undefined"` instead of disappearing
 * - **Functions** render as `"[Function: name]"` instead of disappearing
 * - **Symbols** render as their `.toString()` form
 *
 * This is a pure utility — it performs no I/O and has no side effects.
 *
 * @example
 * ```ts
 * const msg = `Unexpected response: ${safeDebugString(resp)}`
 * ```
 */
export const safeDebugString = (value: unknown, options?: SafeDebugStringOptions): string => {
  const maxLength = options?.maxLength ?? 2000
  const indent = options?.indent ?? 2

  if (value === undefined) {
    return 'undefined'
  }
  if (value === null) {
    return 'null'
  }
  if (typeof value === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`
  }
  if (typeof value === 'symbol') {
    return value.toString()
  }
  if (typeof value === 'bigint') {
    return `<BigInt: ${value}n>`
  }

  if (typeof value !== 'object') {
    return JSON.stringify(value)
  }

  const seen = new WeakSet<object>()

  const replacer = (_key: string, val: unknown): unknown => {
    if (typeof val === 'bigint') {
      return `<BigInt: ${val}n>`
    }
    if (typeof val === 'function') {
      return `[Function: ${val.name || 'anonymous'}]`
    }
    if (typeof val === 'symbol') {
      return val.toString()
    }
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) {
        return '[Circular]'
      }
      seen.add(val)
    }
    return val
  }

  const raw = JSON.stringify(value, replacer, indent)

  if (raw !== undefined && raw.length > maxLength) {
    return `${raw.slice(0, maxLength)}... [truncated]`
  }

  return raw ?? 'undefined'
}
