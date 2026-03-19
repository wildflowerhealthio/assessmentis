import { Schema } from 'effect'

import { mutableEncoded } from '@assessmentis/util'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import { FhirR4Reference } from '../../data-types/complex/identifier-and-reference'

export const CompositionAttesterEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('CompositionAttester'),
  mutableEncoded(
    Schema.Struct({
      mode: Schema.Literal('personal', 'professional', 'legal', 'official'),
      party: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
      time: Schema.optional(Schema.String),
    })
  )
)
