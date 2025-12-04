import { Schema } from 'effect'
import { Coding } from '../../general-purpose/Coding'
import { Location } from '../../video-calls/models/Location'
import { Extension } from '../../general-purpose/BackboneElement'

export const EncounterId = Schema.String.pipe(Schema.brand('EncounterId'))

export type EncounterId = typeof EncounterId.Type

export const Encounter = Schema.Struct({
  id: Schema.optional(EncounterId),
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
  /**
   * Extensions for additional data such as recording and transcript references
   */
  extension: Schema.optional(Schema.Array(Extension)),
})

export type Encounter = typeof Encounter.Type
