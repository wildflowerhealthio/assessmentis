/** Data surfaced when a resource appears in a list view. */
export interface ListableProps {
  /** Primary display name for the list row. */
  readonly displayName: string
  /** Secondary detail strings shown beneath the display name. */
  readonly summaryItems: readonly string[]
}

/** Instance-level Listable trait — every instance exposes its list-view data. */
export interface ListableInstance {
  Listable: ListableProps
}

/** Constructor-level Listable constraint — guarantees instances carry {@link ListableProps}. */
// oxlint-disable-next-line @typescript-eslint/no-explicit-any
export type ListableConstructor = new (...args: any[]) => ListableInstance

/**
 * Narrows a resource to include the Listable trait.
 *
 * @param resource - The value to assert
 *
 * @remarks
 * Needed because a generic `ResourceDataTypes[K]` union prevents TypeScript
 * from seeing the class-level constraint that guarantees instances have
 * the `Listable` property.
 */
export function assertListable<T>(resource: T): asserts resource is T & ListableInstance {
  if (!resource || typeof resource !== 'object' || !('Listable' in resource)) {
    throw new Error('Resource missing Listable trait — did you import the implementation?')
  }
}
