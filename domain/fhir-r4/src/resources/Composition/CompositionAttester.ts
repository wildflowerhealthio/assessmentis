import { Schema } from 'effect'

import { mutableEncoded } from '@assessmentis/util'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4Reference } from '../../data-types/complex/IdentifierAndReference'

export const CompositionAttesterEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('CompositionAttester'),
  mutableEncoded(
    Schema.Struct({
      mode: Schema.Literal('personal', 'professional', 'legal', 'official'),
      time: Schema.optional(Schema.String),
      party: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
    })
  )
)
