import { Schema, pipe } from 'effect'

import { AllDatatypeNames, Extension } from '@assessmentis/clinical-domain/data-types'
import type { ExtensionEncoded } from '@assessmentis/clinical-domain/data-types'
import { TwoStepExternalSchema, extendObjectSchemas, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementIdentification } from '../base/element-identification'
import { FhirChoiceElementTransform } from '../base/fhir-choice-element-transform'
import type { BaseUrl } from '../url-identification'

const EncodedFromFhir: Schema.Schema<ExtensionEncoded, FhirR4.Extension, BaseUrl> = mutableEncoded(
  extendObjectSchemas(
    extendObjectSchemas(
      Schema.Struct({
        definitionUrl: pipe(Schema.String, Schema.propertySignature, Schema.fromKey('url')),
        extension: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(
                (): Schema.Schema<ExtensionEncoded, FhirR4.Extension, BaseUrl> => EncodedFromFhir
              )
            )
          )
        ),
      }),
      FhirChoiceElementTransform('value', AllDatatypeNames)
    ),
    ElementIdentification(Extension.DomainType)
  )
)

export const FhirR4Extension = new TwoStepExternalSchema(Extension, EncodedFromFhir)
