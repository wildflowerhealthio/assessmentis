import { Schema } from 'effect'
import { Coding } from '../../data-types/complex/Coding'
import { DomainResource } from '../../data-types/base/DomainResource'
import { Reference } from '../../data-types/special-purpose/Reference'

export const EncounterId = Schema.String.pipe(Schema.brand('EncounterId'))

export type EncounterId = typeof EncounterId.Type

export const Encounter = Schema.Struct({
  ...DomainResource(EncounterId).fields,
  resourceType: Schema.Literal('Encounter'),
  /**
   * Concepts representing classification of patient encounter such as ambulatory (outpatient), inpatient, emergency, home health or others due to local variations.
   */
  class: Coding,
  /**
   * Note that internal business rules will determine the appropriate transitions that may occur between statuses (and also classes).
   */
  status: Schema.Union(
    Schema.Literal('planned'),
    Schema.Literal('arrived'),
    Schema.Literal('triaged'),
    Schema.Literal('in-progress'),
    Schema.Literal('onleave'),
    Schema.Literal('finished'),
    Schema.Literal('cancelled'),
    Schema.Literal('entered-in-error'),
    Schema.Literal('unknown')
  ),
  location: Schema.optional(
    Schema.Array(Schema.Struct({ location: Reference }))
  ),
})

export type Encounter = typeof Encounter.Type
