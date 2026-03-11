import type { ReadonlyUrl } from './ReadonlyUrl'

/**
 * String literal `'domainType'` used as the discriminant property key on resources.
 * @deprecated
 */
export const ResourceType = 'domainType' as const
/**
 * The literal type `'domainType'`.
 * @deprecated
 */
export type ResourceType = typeof ResourceType

/**
 * String literal `'url'` used as the URL property key on resources.
 * @deprecated
 */
export const ResourceUrl = 'url' as const
/**
 * The literal type `'url'`.
 * @deprecated
 */
export type ResourceUrl = typeof ResourceUrl

/**
 * Base type for any resource managed by the store. Every resource carries a
 * `domainType` discriminant and an optional `url` identifying its location.
 *
 * @typeParam TResourceType - String literal identifying the kind of resource
 */
export interface Resource<out TResourceType extends string> {
  readonly domainType: TResourceType
  readonly url?: ReadonlyUrl | undefined
}

/** Shorthand for a {@link Resource} with an unconstrained `domainType`. */
export type AnyResource = Resource<string>

/**
 * Narrows a type with an optional `url` to one where `url` is guaranteed
 * present. Used to represent resources that have been persisted and assigned
 * a server URL.
 *
 * @typeParam T - The resource type to narrow
 */
export type WithResourceUrl<
  T extends { readonly url?: ReadonlyUrl | undefined },
> = T & {
  readonly url: NonNullable<T['url']>
}

/** Extracts the non-nullable URL type from a {@link Resource}. */
export type InferResourceUrl<T extends Resource<string>> = NonNullable<T['url']>

/**
 * Constraint for the `Resources` type parameter used throughout the store.
 * Maps string keys to {@link Resource.Resource} instances whose `domainType`
 * matches the key.
 */
export type ResourceSet = {
  readonly [K: string]: Resource<typeof K>
}

/**
 * @deprecated Use {@link WithResourceUrl} instead for URL-based identity.
 */
export type WithId<T extends { readonly id?: string | undefined }> = T & {
  readonly id: NonNullable<T['id']>
}
