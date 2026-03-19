/**
 * Creates a mock object that throws an error if any property is accessed.
 * Useful for providing type-safe stubs in tests where the value should never actually be used.
 *
 * @example
 * ```typescript
 * // Instead of: Layer.succeed(LoadedGapiClient, {} as typeof LoadedGapiClient.Service)
 * Layer.succeed(LoadedGapiClient, neverUsedMock<typeof LoadedGapiClient.Service>())
 * ```
 */
export function neverUsedMock<T extends object>(name?: string): T {
  const label = name ?? 'mock'
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Mock proxy requires unsafe cast by design
  return new Proxy((() => {}) as unknown as T, {
    apply() {
      throw new Error(`Unexpected call to ${label} - this mock should never be used`)
    },
    get(_target, prop) {
      throw new Error(
        `Unexpected access to ${label}.${String(prop)} - this mock should never be used`
      )
    },
    set(_target, prop) {
      throw new Error(
        `Unexpected assignment to ${label}.${String(prop)} - this mock should never be used`
      )
    },
  })
}
