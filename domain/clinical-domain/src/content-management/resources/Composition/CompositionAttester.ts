import { Schema } from 'effect'
import type fhir from 'fhir/r4'
import type { BackboneElement } from '../../../data-types/base/BackboneElement'
import { BackboneElementFromFhirR4 } from '../../../data-types/base/BackboneElement'
import type { Reference } from '../../../data-types/complex/IdentifierAndReference'
import { ReferenceFromFhirR4 } from '../../../data-types/complex/IdentifierAndReference'

export const CompositionAttesterId = Schema.String.pipe(
  Schema.brand('CompositionAttesterId')
)
type CompositionAttesterId = typeof CompositionAttesterId.Type

export const CompositionAttesterMode = Schema.Literal(
  'personal',
  'professional',
  'legal',
  'official'
).pipe(Schema.brand('code'))

type CompositionAttesterMode = typeof CompositionAttesterMode.Type

export interface CompositionAttester extends BackboneElement<CompositionAttesterId> {
  mode: CompositionAttesterMode
  time?: string
  party?: Reference
}

/**
 * Attests to accuracy of composition
 */
export const CompositionAttesterFromFhirR4: Schema.Schema<
  CompositionAttester,
  fhir.CompositionAttester,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(CompositionAttesterId),
  Schema.Struct({
    mode: CompositionAttesterMode,
    time: Schema.optional(Schema.String),
    party: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
  })
)
