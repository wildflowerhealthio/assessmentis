import { Schema } from 'effect'

import { mutableEncoded } from '@assessmentis/util'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/identifier-and-reference'

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
      targetIdentifier: Schema.optional(Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)),
      targetReference: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
    })
  )
)
