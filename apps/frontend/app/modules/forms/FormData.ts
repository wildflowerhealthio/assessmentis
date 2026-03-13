import type { Schema } from 'effect'

/**
 * Instance-side contract. Decoded form data knows how to
 * produce domain payloads.
 */

export interface FormData<TResource, TCreatePayload, TUpdatePayload> {
  toCreatePayload(): TCreatePayload
  toUpdatePayload(base: TResource): TUpdatePayload
}
/**
 * Class/static-side contract. The class is a Schema that also
 * carries default form values and a resource → encoded-form converter.
 */

export interface FormDataConstructor<
  TResource,
  TCreatePayload,
  TUpdatePayload,
  TFormData extends FormData<TResource, TCreatePayload, TUpdatePayload>,
  TFormDataEncoded,
> extends Schema.Schema<TFormData, TFormDataEncoded> {
  readonly defaultFormValues: TFormDataEncoded
  fromResource(resource: TResource): TFormDataEncoded
}
