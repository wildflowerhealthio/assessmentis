import type { ReadonlyUrl } from './ReadonlyUrl'

export const ResourceType = 'domainType' as const
export type ResourceType = typeof ResourceType

export const ResourceUrl = 'url' as const
export type ResourceUrl = typeof ResourceUrl

/**
 * Base type for resources that can be used in requests
 */
export interface Resource<TResourceType extends PropertyKey> {
  domainType: TResourceType
  url?: ReadonlyUrl | undefined
}

export type AnyResource = Resource<PropertyKey>
export type WithResourceUrl<T extends { url?: ReadonlyUrl | undefined }> = T & {
  url: NonNullable<T['url']>
}

export type InferResourceUrl<T extends Resource<PropertyKey>> = NonNullable<
  T['url']
>

// Deprecated
export interface BaseResource {
  readonly resourceType: string
  readonly id?: string | undefined
}

// Deprecated
export type WithId<T extends { readonly id?: string | undefined }> = T & {
  readonly id: NonNullable<T['id']>
}

// Deprecated
export type Id<T extends { id?: unknown }> = NonNullable<T['id']>
