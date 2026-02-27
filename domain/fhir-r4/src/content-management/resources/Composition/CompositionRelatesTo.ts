import { Schema } from 'effect'
import { BackboneElementEncodedFromFhir } from '../../../data-types/base/BackboneElement'
import {
  IdentifierEncodedFromFhir,
  ReferenceEncodedFromFhir,
} from '../../../data-types/complex/IdentifierAndReference'
import { mutableEncoded } from '@assessmentis/util'

export const CompositionRelatesToEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('CompositionRelatesTo'),
  mutableEncoded(
    Schema.Struct({
      code: Schema.Union(
        Schema.Literal('replaces'),
        Schema.Literal('transforms'),
        Schema.Literal('signs'),
        Schema.Literal('appends')
      ),
      targetIdentifier: Schema.optional(
        Schema.suspend(() => IdentifierEncodedFromFhir)
      ),
      targetReference: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
    })
  )
)
