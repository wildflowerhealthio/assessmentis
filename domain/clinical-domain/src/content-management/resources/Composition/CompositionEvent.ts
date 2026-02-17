import { Schema } from 'effect'
import { BackboneElement } from '../../../data-types/base/BackboneElement'
import { Reference } from '../../../data-types/complex/IdentifierAndReference'
import { CodeableConcept } from '../../../data-types/complex/CodeableConcept'
import { Period } from '../../../data-types/complex/Period'

const CompositionEventId = Schema.String.pipe(
  Schema.brand('CompositionEventId')
)
type CompositionEventId = typeof CompositionEventId.Type

export interface CompositionEvent extends BackboneElement<CompositionEventId> {
  code?: CodeableConcept[]
  period?: Period
  detail?: Reference[]
}

/**
 * The clinical service(s) being documented
 */
export const CompositionEvent = {
  Schema: Schema.extend(
    BackboneElement.Schema(CompositionEventId),
    Schema.Struct({
      code: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => CodeableConcept.Schema)))
      ),
      period: Schema.optional(Schema.suspend(() => Period.Schema)),
      detail: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
    })
  ),
}
