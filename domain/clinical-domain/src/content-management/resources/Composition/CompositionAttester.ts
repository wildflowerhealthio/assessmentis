import { Schema } from 'effect'
import { BackboneElement } from '../../../data-types/base/BackboneElement'
import { Reference } from '../../../data-types/complex/IdentifierAndReference'

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
export const CompositionAttester = {
  Schema: Schema.extend(
    BackboneElement.Schema(CompositionAttesterId),
    Schema.Struct({
      mode: CompositionAttesterMode,
      time: Schema.optional(Schema.String),
      party: Schema.optional(Schema.suspend(() => Reference.Schema)),
    })
  ),
}
