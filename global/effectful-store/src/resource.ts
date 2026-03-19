import type { Schema } from 'effect'
import type { ReadonlyUrl } from './readonly-url'

/**
 * String literal `'domainType'` used as the discriminant property key on resources.
 * @deprecated Use the string literal `'domainType'` directly.
 */
export const ResourceType = 'domainType' as const
/**
 * The literal type `'domainType'`.
 * @deprecated Use the string literal `'domainType'` directly.
 */
export type ResourceType = typeof ResourceType

/**
 * String literal `'url'` used as the URL property key on resources.
 * @deprecated Use the string literal `'url'` directly.
 */
export const ResourceUrl = 'url' as const
/**
 * The literal type `'url'`.
 * @deprecated Use the string literal `'url'` directly.
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
export type WithResourceUrl<T extends { readonly url?: ReadonlyUrl | undefined }> = T & {
  readonly url: NonNullable<T['url']>
}

/**
 * Type guard that narrows a resource to {@link WithResourceUrl}.
 * Returns true when the resource has a non-undefined `url`.
 */
export const hasResourceUrl = <T extends AnyResource>(value: T): value is WithResourceUrl<T> =>
  value.url !== undefined

/** Extracts the non-nullable URL type from a {@link Resource}. */
export type InferResourceUrl<T extends Resource<string>> = NonNullable<T['url']>

/**
 * Constraint for the `Resources` type parameter used throughout the store.
 * Maps string keys to {@link Resource.Resource} instances whose `domainType`
 * matches the key.
 *
 * @deprecated Use {@link DomainClass} union instead.
 */
export interface ResourceSet {
  readonly [K: string]: Resource<typeof K>
}

/**
 * Constraint for a class constructor that produces {@link Resource} instances.
 * Hub, Repository, Origin, and related types are parameterized by a union of
 * `DomainClass` types rather than a mapped {@link ResourceSet}.
 *
 * @typeParam Instance - The instance type produced by the constructor
 * @typeParam TDomainType - String literal identifying the resource kind
 * @typeParam TUrlSchema - The branded URL schema for this resource type
 */
export interface DomainClass<
  out Instance extends {
    readonly domainType: TDomainType
    readonly url?: TUrl | undefined
  },
  out TDomainType extends string,
  TUrl extends ReadonlyUrl,
> {
  readonly DomainType: TDomainType
  readonly UrlSchema: Schema.Schema<TUrl, string>
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): Instance
}

/** Shorthand for a {@link DomainClass} with unconstrained type parameters. */
// oxlint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDomainClass = DomainClass<Resource<string>, string, any>

/**
 * @deprecated Use {@link WithResourceUrl} instead.
 */
export type WithId<T extends { readonly id?: string | undefined }> = T & {
  readonly id: NonNullable<T['id']>
}
