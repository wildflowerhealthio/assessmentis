import {
  BackboneElement,
  Element,
  Reference,
} from '@assessmentis/clinical-domain/data-types'
import { Schema } from 'effect'

export const CompositionAttesterId = Schema.String.pipe(
  Schema.brand('CompositionAttesterId')
)

export const CompositionAttesterMode = Schema.Literal(
  'personal',
  'professional',
  'legal',
  'official'
).pipe(Schema.brand('code'))
/**
 * Attests to accuracy of composition
 */

export const CompositionAttester = Schema.Struct({
  ...BackboneElement(CompositionAttesterId).fields,
  /**
   * personal | professional | legal | official
   */
  mode: CompositionAttesterMode,
  /**
   * Contains extended information for property 'mode'.
   */
  _mode: Schema.optional(Element(Schema.String)),
  /**
   * When the composition was attested
   */
  time: Schema.optional(Schema.String),
  /**
   * Contains extended information for property 'time'.
   */
  _time: Schema.optional(Element(Schema.String)),
  /**
   * Who attested the composition
   */
  party: Schema.optional(Schema.suspend(() => Reference)),
})

export type CompositionAttester = typeof CompositionAttester.Type
