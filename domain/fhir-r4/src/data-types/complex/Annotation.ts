import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { Annotation } from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'
import { ReferenceEncodedFromFhir } from './IdentifierAndReference'

export const AnnotationEncodedFromFhir: Schema.Schema<
  Annotation.AnnotationEncoded,
  FhirR4.Annotation,
  BaseUrl
> = Schema.extend(
  ElementIdentification('Annotation'),
  mutableEncoded(
    Schema.Struct({
      authorString: Schema.optional(Schema.String),
      authorReference: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      time: Schema.optional(Schema.String),
      text: Schema.String,
    })
  )
)

const AnnotationSchema: Schema.Schema<
  Annotation.Annotation,
  FhirR4.Annotation,
  BaseUrl
> = Schema.compose(AnnotationEncodedFromFhir, Annotation.Annotation)

export const FhirR4Annotation = {
  Schema: AnnotationSchema,
}
