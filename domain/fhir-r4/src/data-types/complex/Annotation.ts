import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { Annotation } from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../base/Element'
import { mutableEncoded } from '@assessmentis/util'
import { TwoStepExternalSchema } from '../../TwoStepExternalSchema'
import { FhirR4Reference } from './IdentifierAndReference'

const EncodedFromFhir: Schema.Schema<
  Annotation.AnnotationEncoded,
  FhirR4.Annotation,
  BaseUrl
> = Schema.extend(
  ElementIdentification('Annotation'),
  mutableEncoded(
    Schema.Struct({
      authorString: Schema.optional(Schema.String),
      authorReference: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      time: Schema.optional(Schema.String),
      text: Schema.String,
    })
  )
)

export const FhirR4Annotation = new TwoStepExternalSchema(
  Annotation.Annotation,
  EncodedFromFhir
)
