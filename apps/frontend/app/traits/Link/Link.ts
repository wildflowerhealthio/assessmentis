/** Instance-level Link trait — provides a client-side route path for the resource. */
export interface LinkInstance {
  readonly Link: string
}

/**
 * Constructor-level Link constraint.
 *
 * @remarks
 * The static `Link` is the collection route (e.g. `"/Patient"`), while
 * instances compute a resource-specific route (e.g. `"/Patient/123"`).
 */
export interface LinkConstructor {
  Link: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): LinkInstance
}

/**
 * Narrows a resource to include the Link trait.
 *
 * @param resource - The value to assert
 */
export function assertLink<T>(
  resource: T
): asserts resource is T & LinkInstance {
  if (!resource || typeof resource !== 'object' || !('Link' in resource)) {
    throw new Error(
      'Resource missing Link trait — did you import the implementation?'
    )
  }
}
