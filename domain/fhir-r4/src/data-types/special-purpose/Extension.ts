import { pipe, Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Extension,
  type ExtensionEncoded,
} from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../UrlIdentification'
import {
  AllDatatypeKeys,
  DatatypeChoiceEncodedPassthroughFields,
} from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded } from '@assessmentis/util'

export const ExtensionEncodedFromFhir: Schema.Schema<
  ExtensionEncoded,
  FhirR4.Extension,
  BaseUrl
> = mutableEncoded(
  Schema.extend(
    Schema.Struct({
      definitionUrl: pipe(
        Schema.String,
        Schema.propertySignature,
        Schema.fromKey('url')
      ),
      extension: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ExtensionEncodedFromFhir))
        )
      ),
      ...DatatypeChoiceEncodedPassthroughFields('value', AllDatatypeKeys),
    }),
    ElementIdentification(Extension.Key)
  )
)

const ExtensionSchema: Schema.Schema<Extension, FhirR4.Extension, BaseUrl> =
  Schema.compose(ExtensionEncodedFromFhir, Extension)

export const FhirR4Extension = {
  Schema: ExtensionSchema,
}
