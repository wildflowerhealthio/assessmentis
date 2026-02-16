/**
 * Base type for resources that can be used in requests
 */

export interface BaseResource {
  readonly resourceType: string
  readonly id?: string | undefined
}

export type WithId<T extends { readonly id?: string | undefined }> = T & {
  readonly id: NonNullable<T['id']>
}
