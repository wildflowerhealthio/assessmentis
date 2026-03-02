import type { ReadonlyUrl } from './ReadonlyUrl'

export const ResourceType = 'domainType' as const
export type ResourceType = typeof ResourceType

export const ResourceUrl = 'url' as const
export type ResourceUrl = typeof ResourceUrl

/**
 * Base type for resources that can be used in requests
 */
export interface Resource<out TResourceType extends string> {
  readonly domainType: TResourceType
  readonly url?: ReadonlyUrl | undefined
}

export type AnyResource = Resource<string>
export type WithResourceUrl<
  T extends { readonly url?: ReadonlyUrl | undefined },
> = T & {
  readonly url: NonNullable<T['url']>
}

export type InferResourceUrl<T extends Resource<string>> = NonNullable<T['url']>

// Deprecated
export type WithId<T extends { readonly id?: string | undefined }> = T & {
  readonly id: NonNullable<T['id']>
}
