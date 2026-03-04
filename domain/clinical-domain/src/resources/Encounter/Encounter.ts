import { Schema } from 'effect'

import { AnnotateArrayWithArbitrary, MergeClasses } from '@assessmentis/util'

import { Resource, type ResourceEncoded } from '../../data-types/base/Resource'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Coding } from '../../data-types/complex/Coding'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { Period } from '../../data-types/complex/Period'
import { Quantity } from '../../data-types/complex/Quantity'
import { EncounterClassHistory } from './EncounterClassHistory'
import { EncounterDiagnosis } from './EncounterDiagnosis'
import { EncounterHospitalization } from './EncounterHospitalization'
import { EncounterLocation } from './EncounterLocation'
import { EncounterParticipant } from './EncounterParticipant'
import {
  EncounterStatus,
  EncounterStatusHistory,
} from './EncounterStatusHistory'

const Key = 'Encounter' as const
type Key = typeof Key

// --- Encounter ---

const fields = {
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
  status: EncounterStatus,
  statusHistory: Schema.optional(
    Schema.Array(EncounterStatusHistory).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  class: Schema.suspend(() => Coding),
  classHistory: Schema.optional(
    Schema.Array(EncounterClassHistory).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  type: Schema.optional(Schema.Array(Schema.suspend(() => CodeableConcept))),
  serviceType: Schema.optional(Schema.suspend(() => CodeableConcept)),
  priority: Schema.optional(Schema.suspend(() => CodeableConcept)),
  subject: Schema.optional(Schema.suspend(() => Reference)),
  episodeOfCare: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  basedOn: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  participant: Schema.optional(
    Schema.Array(EncounterParticipant).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  appointment: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  period: Schema.optional(Schema.suspend(() => Period)),
  length: Schema.optional(Schema.suspend(() => Quantity)),
  reasonCode: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  reasonReference: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference))
  ),
  diagnosis: Schema.optional(
    Schema.Array(EncounterDiagnosis).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  account: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  hospitalization: Schema.optional(EncounterHospitalization),
  location: Schema.optional(
    Schema.Array(EncounterLocation).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  serviceProvider: Schema.optional(Schema.suspend(() => Reference)),
  partOf: Schema.optional(Schema.suspend(() => Reference)),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(Key)

export interface EncounterEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<Key> {}

/**
 * An interaction between a patient and healthcare provider(s) for the purpose of
 * providing healthcare service(s) or assessing the health status of a patient.
 */
export class Encounter extends MergeClasses<Encounter>(Key)(
  [],
  resourceMixin,
  fields
) {}
