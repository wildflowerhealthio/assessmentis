import { Schema } from 'effect'

import {
  Annotation,
  type AnnotationEncoded,
} from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded, TwoStepExternalSchema } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/Element'
import type { BaseUrl } from '../UrlIdentification'
import { FhirR4Reference } from './IdentifierAndReference'

const EncodedFromFhir: Schema.Schema<
  AnnotationEncoded,
  FhirR4.Annotation,
  BaseUrl
> = Schema.extend(
  ElementEncodedFromFhir('Annotation'),
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
  Annotation,
  EncodedFromFhir
)
