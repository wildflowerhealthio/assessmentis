import { Schema } from 'effect'
import { Coding } from '../../general-purpose/Coding'
import { DomainResource } from '../../general-purpose/DomainResource'
import { Location } from '../../video-calls/models/Location'

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
  status: Schema.String,
  // ('planned'|'arrived'|'triaged'|'in-progress'|'onleave'|'finished'|'cancelled'|'entered-in-error'|'unknown');
  location: Schema.optional(
    Schema.Array(Schema.Struct({ location: Location }))
  ),
})

export type Encounter = typeof Encounter.Type
