import { Schema } from 'effect'
import { BackboneElementEncodedFromFhir } from '../../../data-types/base/BackboneElement'
import { ReferenceEncodedFromFhir } from '../../../data-types/complex/IdentifierAndReference'
import { mutableEncoded } from '@assessmentis/util'

export const CompositionAttesterEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('CompositionAttester'),
  mutableEncoded(
    Schema.Struct({
      mode: Schema.Literal('personal', 'professional', 'legal', 'official'),
      time: Schema.optional(Schema.String),
      party: Schema.optional(Schema.suspend(() => ReferenceEncodedFromFhir)),
    })
  )
)
