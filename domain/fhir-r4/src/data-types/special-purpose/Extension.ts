import { pipe, Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Extension,
  type ExtensionEncoded,
} from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../base/ElementIdentification'
import {
  AllDatatypeKeys,
  DatatypeChoiceEncodedPassthroughFields,
} from '@assessmentis/clinical-domain/data-types'
import { extendObjectSchemas, mutableEncoded } from '@assessmentis/util'
import { TwoStepExternalSchema } from '@assessmentis/util'

const EncodedFromFhir: Schema.Schema<
  ExtensionEncoded,
  FhirR4.Extension,
  BaseUrl
> = mutableEncoded(
  extendObjectSchemas(
    Schema.Struct({
      definitionUrl: pipe(
        Schema.String,
        Schema.propertySignature,
        Schema.fromKey('url')
      ),
      extension: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(
              (): Schema.Schema<ExtensionEncoded, FhirR4.Extension, BaseUrl> =>
                EncodedFromFhir
            )
          )
        )
      ),
      ...DatatypeChoiceEncodedPassthroughFields('value', AllDatatypeKeys),
    }),
    ElementIdentification(Extension.DomainType)
  )
)

export const FhirR4Extension = new TwoStepExternalSchema(
  Extension,
  EncodedFromFhir
)
