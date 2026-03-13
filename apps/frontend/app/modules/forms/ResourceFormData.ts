import type { ResourceDataTypes } from '@assessmentis/clinical-domain'
import type { Resource } from '@assessmentis/effectful-store'

import type { FormData, FormDataConstructor } from './FormData'

/**
 * Narrowed constructor type for resource page components.
 * Fixes TCreatePayload = ResourceDataTypes[K] and
 * TUpdatePayload = Resource.WithResourceUr\<ResourceDataTypes[K]\>.
 */
export type ResourceFormDataConstructor<
  K extends keyof ResourceDataTypes & string,
  TFormData extends ResourceFormData<K>,
  TFormDataEncoded,
> = FormDataConstructor<
  ResourceDataTypes[K],
  ResourceDataTypes[K],
  Resource.WithResourceUrl<ResourceDataTypes[K]>,
  TFormData,
  TFormDataEncoded
>

export interface ResourceFormData<
  K extends keyof ResourceDataTypes & string,
> extends FormData<
  ResourceDataTypes[K],
  ResourceDataTypes[K],
  Resource.WithResourceUrl<ResourceDataTypes[K]>
> {}
