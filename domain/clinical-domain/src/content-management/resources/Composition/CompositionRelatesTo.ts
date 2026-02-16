import { Schema } from 'effect'
import type fhir from 'fhir/r4'
import type { BackboneElement } from '../../../data-types/base/BackboneElement'
import { BackboneElementFromFhirR4 } from '../../../data-types/base/BackboneElement'
import type {
  Identifier,
  Reference,
} from '../../../data-types/complex/IdentifierAndReference'
import {
  IdentifierFromFhirR4,
  ReferenceFromFhirR4,
} from '../../../data-types/complex/IdentifierAndReference'

const CompositionRelatesToId = Schema.String.pipe(
  Schema.brand('CompositionRelatesToId')
)
type CompositionRelatesToId = typeof CompositionRelatesToId.Type

export interface CompositionRelatesTo extends BackboneElement<CompositionRelatesToId> {
  code: 'replaces' | 'transforms' | 'signs' | 'appends'
  targetIdentifier?: Identifier
  targetReference?: Reference
}

/**
 * Relationships to other compositions/documents
 */
export const CompositionRelatesToFromFhirR4: Schema.Schema<
  CompositionRelatesTo,
  fhir.CompositionRelatesTo,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(CompositionRelatesToId),
  Schema.Struct({
    code: Schema.Union(
      Schema.Literal('replaces'),
      Schema.Literal('transforms'),
      Schema.Literal('signs'),
      Schema.Literal('appends')
    ),
    targetIdentifier: Schema.optional(
      Schema.suspend(() => IdentifierFromFhirR4)
    ),
    targetReference: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
  })
)
