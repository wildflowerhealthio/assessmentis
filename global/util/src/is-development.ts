/**
 * Detects whether the current environment is a development build.
 *
 * @returns `true` when running in a development environment, `false` otherwise
 *
 * @remarks
 * Checks two environment sources in order:
 * 1. **Node.js** — `globalThis.process?.env?.NODE_ENV === 'development'`
 * 2. **Vite** — `import.meta.env?.MODE === 'development'`
 *
 * This centralises the cross-environment detection so that domain packages
 * can call `isDevelopment()` without needing `any` casts or
 * `eslint-disable` comments in each call site. The `any` cast on
 * `import.meta` is isolated here because Vite's `import.meta.env` typing
 * is only available when `vite/client` types are included, which domain
 * packages intentionally omit.
 */
export const isDevelopment = (): boolean => {
  // Node.js / test runners — globalThis.process is available without
  // A `declare` statement and without needing @types/node.
  const proc: { env?: { NODE_ENV?: string } } | undefined =
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion typescript/no-explicit-any
    (globalThis as any).process
  if (proc?.env?.NODE_ENV !== undefined) {
    return proc.env.NODE_ENV === 'development'
  }

  // Vite client — import.meta.env is only typed when vite/client is
  // Included, so we cast to access it safely. We use try/catch because
  // Vite statically transforms `import.meta.env` references, which can
  // Cause unexpected runtime errors in environments where the transform
  // Produces invalid access patterns.
  try {
    let env: { MODE?: string } | undefined

    if (typeof import.meta === 'object') {
      // oxlint-disable-next-line typescript/no-explicit-any typescript/no-unsafe-type-assertion
      env = (import.meta as any)?.env
    }
    return env?.MODE === 'development'
  } catch {
    return false
  }
}
