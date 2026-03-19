import { Schema } from 'effect'

import { Annotation } from '@assessmentis/clinical-domain/data-types'
import type { AnnotationEncoded } from '@assessmentis/clinical-domain/data-types'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/element'
import type { BaseUrl } from '../url-identification'
import { FhirR4Reference } from './identifier-and-reference'

const EncodedFromFhir: Schema.Schema<AnnotationEncoded, FhirR4.Annotation, BaseUrl> = Schema.extend(
  ElementEncodedFromFhir('Annotation'),
  mutableEncoded(
    Schema.Struct({
      authorReference: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
      authorString: Schema.optional(Schema.String),
      text: Schema.String,
      time: Schema.optional(Schema.String),
    })
  )
)

export const FhirR4Annotation = new TwoStepExternalSchema(Annotation, EncodedFromFhir)
