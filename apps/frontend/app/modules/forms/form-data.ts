import type { Schema } from 'effect'

import type { Resource } from '@assessmentis/effectful-store'

/**
 * Instance-side contract. Decoded form data knows how to
 * produce domain payloads.
 */

export interface FormData<TResource extends Resource.AnyResource, TCreatePayload, TUpdatePayload> {
  toCreatePayload(): TCreatePayload
  toUpdatePayload(base: Resource.WithResourceUrl<TResource>): TUpdatePayload
}
/**
 * Class/static-side contract. The class is a Schema that also
 * carries default form values and a resource → encoded-form converter.
 */

export interface FormDataConstructor<
  TResource extends Resource.AnyResource,
  TCreatePayload,
  TUpdatePayload,
  TFormData extends FormData<TResource, TCreatePayload, TUpdatePayload>,
  TFormDataEncoded,
> extends Schema.Schema<TFormData, TFormDataEncoded> {
  readonly defaultFormValues: TFormDataEncoded
  fromResource(resource: TResource): TFormDataEncoded
}
