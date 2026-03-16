import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'
import type { Resource } from '@assessmentis/effectful-store'

import type { FormData, FormDataConstructor } from './FormData'

/**
 * Narrowed constructor type for resource page components.
 * Fixes TCreatePayload = InstanceType<K> and
 * TUpdatePayload = Resource.WithResourceUrl<InstanceType<K>>.
 */
export type ResourceFormDataConstructor<
  K extends ClinicalDomainClasses,
  TFormData extends ResourceFormData<K>,
  TFormDataEncoded,
> = FormDataConstructor<
  InstanceType<K>,
  InstanceType<K>,
  Resource.WithResourceUrl<InstanceType<K>>,
  TFormData,
  TFormDataEncoded
>

export interface ResourceFormData<
  K extends ClinicalDomainClasses,
> extends FormData<
  InstanceType<K>,
  InstanceType<K>,
  Resource.WithResourceUrl<InstanceType<K>>
> {}
