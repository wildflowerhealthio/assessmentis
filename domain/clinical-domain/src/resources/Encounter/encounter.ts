import { Schema } from 'effect'

import { Search } from '@assessmentis/effectful-store'
import { AnnotateArrayWithArbitrary, makeCloneWith } from '@assessmentis/util'

import { Resource } from '../../data-types/base/resource'
import type { ResourceEncoded } from '../../data-types/base/resource'
import { CodeableConcept } from '../../data-types/complex/codeable-concept'
import { Coding } from '../../data-types/complex/coding'
import { Identifier, Reference } from '../../data-types/complex/identifier-and-reference'
import { Period } from '../../data-types/complex/period'
import { Quantity } from '../../data-types/complex/quantity'
import { Patient } from '../Patient/patient'
import { EncounterClassHistory } from './encounter-class-history'
import { EncounterDiagnosis } from './encounter-diagnosis'
import { EncounterHospitalization } from './encounter-hospitalization'
import { EncounterLocation } from './encounter-location'
import { EncounterParticipant } from './encounter-participant'
import { EncounterStatus, EncounterStatusHistory } from './encounter-status-history'

const DomainType = 'Encounter' as const
type DomainType = typeof DomainType

// --- Encounter ---

const fields = {
  account: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  appointment: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  basedOn: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  class: Schema.suspend(() => Coding),
  classHistory: Schema.optional(
    Schema.Array(EncounterClassHistory).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  diagnosis: Schema.optional(
    Schema.Array(EncounterDiagnosis).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  episodeOfCare: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  hospitalization: Schema.optional(EncounterHospitalization),
  identifier: Schema.optional(
    Schema.Array(Schema.suspend(() => Identifier)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  length: Schema.optional(Schema.suspend(() => Quantity)),
  location: Schema.optional(
    Schema.Array(EncounterLocation).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  partOf: Schema.optional(Schema.suspend(() => Reference)),
  participant: Schema.optional(
    Schema.Array(EncounterParticipant).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  period: Schema.optional(Schema.suspend(() => Period)),
  priority: Schema.optional(Schema.suspend(() => CodeableConcept)),
  reasonCode: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  reasonReference: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  serviceProvider: Schema.optional(Schema.suspend(() => Reference)),
  serviceType: Schema.optional(Schema.suspend(() => CodeableConcept)),
  status: EncounterStatus,
  statusHistory: Schema.optional(
    Schema.Array(EncounterStatusHistory).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  subject: Schema.optional(Schema.suspend(() => Reference)),
  type: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
} as const satisfies Schema.Struct.Fields

const EncounterResource = Resource(DomainType)

/** Encoded (wire-format) shape of an {@link Encounter}. */
export interface EncounterEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {}

/**
 * An interaction between a patient and healthcare provider(s) for the purpose of
 * providing healthcare service(s) or assessing the health status of a patient.
 */
export class Encounter extends EncounterResource.extend<Encounter>(DomainType)(fields) {
  static readonly DomainType = EncounterResource.DomainType
  static readonly UrlSchema = EncounterResource.UrlSchema
  static readonly SearchSchema = {
    patient: Search.field(Patient.UrlSchema, ['Exactly']),
  } as const satisfies Search.Schema
  readonly cloneWith = makeCloneWith(Encounter, this)
}
