import { Schema } from 'effect'
import { applySchemaMixinTo } from '@assessmentis/util'
import { BackboneElement } from '../../data-types/base/BackboneElement'
import { Resource, type ResourceEncoded } from '../../data-types/base/Resource'
import { Coding } from '../../data-types/complex/Coding'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import {
  Reference,
  Identifier,
} from '../../data-types/complex/IdentifierAndReference'
import { Period } from '../../data-types/complex/Period'
import { Quantity } from '../../data-types/complex/Quantity'

const Key = 'Encounter' as const
type Key = typeof Key

// --- Shared value sets ---

const EncounterStatus = Schema.Union(
  Schema.Literal('planned'),
  Schema.Literal('arrived'),
  Schema.Literal('triaged'),
  Schema.Literal('in-progress'),
  Schema.Literal('onleave'),
  Schema.Literal('finished'),
  Schema.Literal('cancelled'),
  Schema.Literal('entered-in-error'),
  Schema.Literal('unknown')
)

const EncounterLocationStatus = Schema.Union(
  Schema.Literal('planned'),
  Schema.Literal('active'),
  Schema.Literal('reserved'),
  Schema.Literal('completed')
)

// --- Sub-component schemas ---

const EncounterStatusHistorySchema = Schema.Struct({
  ...BackboneElement('EncounterStatusHistory').fields,
  status: EncounterStatus,
  period: Schema.suspend(() => Period),
})

const EncounterClassHistorySchema = Schema.Struct({
  ...BackboneElement('EncounterClassHistory').fields,
  class: Schema.suspend(() => Coding),
  period: Schema.suspend(() => Period),
})

const EncounterParticipantSchema = Schema.Struct({
  ...BackboneElement('EncounterParticipant').fields,
  type: Schema.optional(Schema.Array(Schema.suspend(() => CodeableConcept))),
  period: Schema.optional(Schema.suspend(() => Period)),
  individual: Schema.optional(Schema.suspend(() => Reference)),
})

const EncounterDiagnosisSchema = Schema.Struct({
  ...BackboneElement('EncounterDiagnosis').fields,
  condition: Schema.suspend(() => Reference),
  use: Schema.optional(Schema.suspend(() => CodeableConcept)),
  rank: Schema.optional(Schema.Int.pipe(Schema.positive())),
})

const EncounterHospitalizationSchema = Schema.Struct({
  ...BackboneElement('EncounterHospitalization').fields,
  preAdmissionIdentifier: Schema.optional(Schema.suspend(() => Identifier)),
  origin: Schema.optional(Schema.suspend(() => Reference)),
  admitSource: Schema.optional(Schema.suspend(() => CodeableConcept)),
  reAdmission: Schema.optional(Schema.suspend(() => CodeableConcept)),
  dietPreference: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  specialCourtesy: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  specialArrangement: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  destination: Schema.optional(Schema.suspend(() => Reference)),
  dischargeDisposition: Schema.optional(Schema.suspend(() => CodeableConcept)),
})

const EncounterLocationSchema = Schema.Struct({
  ...BackboneElement('EncounterLocation').fields,
  location: Schema.suspend(() => Reference),
  status: Schema.optional(EncounterLocationStatus),
  physicalType: Schema.optional(Schema.suspend(() => CodeableConcept)),
  period: Schema.optional(Schema.suspend(() => Period)),
})

// --- Encounter ---

const fields = {
  resourceType: Schema.Literal('Encounter'),
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
  status: EncounterStatus,
  statusHistory: Schema.optional(Schema.Array(EncounterStatusHistorySchema)),
  class: Schema.suspend(() => Coding),
  classHistory: Schema.optional(Schema.Array(EncounterClassHistorySchema)),
  type: Schema.optional(Schema.Array(Schema.suspend(() => CodeableConcept))),
  serviceType: Schema.optional(Schema.suspend(() => CodeableConcept)),
  priority: Schema.optional(Schema.suspend(() => CodeableConcept)),
  subject: Schema.optional(Schema.suspend(() => Reference)),
  episodeOfCare: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  basedOn: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  participant: Schema.optional(Schema.Array(EncounterParticipantSchema)),
  appointment: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  period: Schema.optional(Schema.suspend(() => Period)),
  length: Schema.optional(Schema.suspend(() => Quantity)),
  reasonCode: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  reasonReference: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference))
  ),
  diagnosis: Schema.optional(Schema.Array(EncounterDiagnosisSchema)),
  account: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  hospitalization: Schema.optional(EncounterHospitalizationSchema),
  location: Schema.optional(Schema.Array(EncounterLocationSchema)),
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
class Encounter extends Schema.Class<Encounter>(Key)({
  ...resourceMixin.fields,
  ...fields,
}) {}

const EncounterWithMixin = applySchemaMixinTo(Encounter, resourceMixin)
type EncounterWithMixin = Encounter

export { EncounterWithMixin as Encounter }
