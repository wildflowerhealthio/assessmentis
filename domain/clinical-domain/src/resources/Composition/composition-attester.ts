import { Schema } from 'effect'

import { BackboneElement } from '../../data-types/base/backbone-element'
import { Reference } from '../../data-types/complex/identifier-and-reference'

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
export class CompositionAttester extends BackboneElement(
  'CompositionAttester'
).extend<CompositionAttester>('CompositionAttesterSchema')({
  mode: CompositionAttesterMode,
  party: Schema.optional(Schema.suspend(() => Reference)),
  time: Schema.optional(Schema.String),
}) {}
