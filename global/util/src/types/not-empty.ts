/**
 * Resolves to `T` if it has at least one known key, otherwise resolves to
 * `never`. Useful as a constraint to reject empty objects at the type level.
 */
export type NotEmpty<T> = keyof T extends never ? never : T
