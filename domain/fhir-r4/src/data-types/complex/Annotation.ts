import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { Annotation } from '@assessmentis/clinical-domain/data-types'
import { AnnotationId } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Element } from '../base/Element'
import { FhirR4Reference } from './IdentifierAndReference'

const FhirR4AnnotationSchema: Schema.Schema<
  Annotation,
  FhirR4.Annotation,
  never
> = Schema.extend(
  FhirR4Element.Schema(AnnotationId),
  Schema.mutable(
    Schema.Struct({
      authorString: Schema.optional(Schema.String),
      authorReference: Schema.optional(
        Schema.suspend(() => FhirR4Reference.Schema)
      ),
      time: Schema.optional(Schema.DateTimeUtc),
      text: Schema.String,
    })
  )
)

export const FhirR4Annotation = {
  Schema: FhirR4AnnotationSchema,
}
