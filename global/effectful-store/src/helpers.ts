/**
 * Generic helpers for working with Effect Request/RequestResolver
 * Lightly resource-aware: understands things with {resourceType: string, id: string}
 */

/**
 * Type guard to check if an object has resourceType and id properties
 */
export const hasResourceTypeAndId = (
  value: unknown
): value is { resourceType: string; id: string } => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'resourceType' in value &&
    typeof value.resourceType === 'string' &&
    'id' in value &&
    typeof value.id === 'string'
  )
}

/**
 * Group an array of items by a key function
 */
export const groupBy = <T, K extends string | number>(
  items: ReadonlyArray<T>,
  keyFn: (item: T) => K
): Map<K, T[]> => {
  const groups = new Map<K, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    const group = groups.get(key)
    if (group) {
      group.push(item)
    } else {
      groups.set(key, [item])
    }
  }
  return groups
}
