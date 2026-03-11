import { Schema } from 'effect'

import { BackboneElement } from '../../data-types/base/BackboneElement'
import { Reference } from '../../data-types/complex/IdentifierAndReference'

/** FHIR R4 attester mode — personal, professional, legal, or official. */
export const CompositionAttesterMode = Schema.Literal(
  'personal',
  'professional',
  'legal',
  'official'
).pipe(Schema.brand('code'))

type CompositionAttesterMode = typeof CompositionAttesterMode.Type

/**
 * Attests to accuracy of composition
 */
export const CompositionAttesterSchema = Schema.Struct({
  ...BackboneElement('CompositionAttester').fields,
  mode: CompositionAttesterMode,
  time: Schema.optional(Schema.String),
  party: Schema.optional(Schema.suspend(() => Reference)),
})
