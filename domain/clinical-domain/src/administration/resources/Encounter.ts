import { Schema } from 'effect'
import { Coding } from '../../data-types/complex/Coding'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { DomainResource } from '../../data-types/base/DomainResource'
import {
  Reference,
  Identifier,
} from '../../data-types/complex/IdentifierAndReference'
import { Period } from '../../data-types/complex/Period'
import { SimpleQuantity } from '../../data-types/complex/SimpleQuantity'
import { BackboneElement } from '../../data-types/base/BackboneElement'

export const EncounterId = Schema.String.pipe(Schema.brand('EncounterId'))

export type EncounterId = typeof EncounterId.Type

/**
 * Status history component
 */
const StatusHistoryId = Schema.String.pipe(Schema.brand('StatusHistoryId'))
const EncounterStatusHistory = Schema.Struct({
  ...BackboneElement(StatusHistoryId).fields,
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
  period: Period,
})

/**
 * Class history component
 */
const ClassHistoryId = Schema.String.pipe(Schema.brand('ClassHistoryId'))
const EncounterClassHistory = Schema.Struct({
  ...BackboneElement(ClassHistoryId).fields,
  class: Coding,
  period: Period,
})

/**
 * Participant component
 */
const ParticipantId = Schema.String.pipe(Schema.brand('ParticipantId'))
const EncounterParticipant = Schema.Struct({
  ...BackboneElement(ParticipantId).fields,
  type: Schema.optional(Schema.Array(CodeableConcept)),
  period: Schema.optional(Period),
  individual: Schema.optional(Reference),
})

/**
 * Diagnosis component
 */
const DiagnosisId = Schema.String.pipe(Schema.brand('DiagnosisId'))
const EncounterDiagnosis = Schema.Struct({
  ...BackboneElement(DiagnosisId).fields,
  condition: Reference,
  use: Schema.optional(CodeableConcept),
  rank: Schema.optional(Schema.Int.pipe(Schema.positive())),
})

/**
 * Location component
 */
const LocationId = Schema.String.pipe(Schema.brand('LocationId'))
const EncounterLocation = Schema.Struct({
  ...BackboneElement(LocationId).fields,
  location: Reference,
  status: Schema.optional(
    Schema.Union(
      Schema.Literal('planned'),
      Schema.Literal('active'),
      Schema.Literal('reserved'),
      Schema.Literal('completed')
    )
  ),
  physicalType: Schema.optional(CodeableConcept),
  period: Schema.optional(Period),
})

/**
 * Hospitalization component
 */
const HospitalizationId = Schema.String.pipe(Schema.brand('HospitalizationId'))
const EncounterHospitalization = Schema.Struct({
  ...BackboneElement(HospitalizationId).fields,
  preAdmissionIdentifier: Schema.optional(Identifier),
  origin: Schema.optional(Reference),
  admitSource: Schema.optional(CodeableConcept),
  reAdmission: Schema.optional(CodeableConcept),
  dietPreference: Schema.optional(Schema.Array(CodeableConcept)),
  specialCourtesy: Schema.optional(Schema.Array(CodeableConcept)),
  specialArrangement: Schema.optional(Schema.Array(CodeableConcept)),
  destination: Schema.optional(Reference),
  dischargeDisposition: Schema.optional(CodeableConcept),
})

export const Encounter = Schema.Struct({
  ...DomainResource(EncounterId).fields,
  resourceType: Schema.Literal('Encounter'),
  /**
   * Identifier(s) by which this encounter is known
   */
  identifier: Schema.optional(Schema.Array(Identifier)),
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
  /**
   * The status history permits the encounter resource to contain the status history without needing to read through the historical versions of the resource, or even have the server store them.
   */
  statusHistory: Schema.optional(Schema.Array(EncounterStatusHistory)),
  /**
   * Concepts representing classification of patient encounter such as ambulatory (outpatient), inpatient, emergency, home health or others due to local variations.
   */
  class: Coding,
  /**
   * The class history permits the tracking of the encounters transitions without needing to go through the resource history. This would be used for a case where an admission starts of as an emergency encounter, then transitions into an inpatient scenario.
   */
  classHistory: Schema.optional(Schema.Array(EncounterClassHistory)),
  /**
   * Specific type of encounter (e.g. e-mail consultation, surgical day-care, skilled nursing, rehabilitation).
   */
  type: Schema.optional(Schema.Array(CodeableConcept)),
  /**
   * Broad categorization of the service that is to be provided (e.g. cardiology).
   */
  serviceType: Schema.optional(CodeableConcept),
  /**
   * Indicates the urgency of the encounter.
   */
  priority: Schema.optional(CodeableConcept),
  /**
   * The patient or group present at the encounter.
   */
  subject: Schema.optional(Reference),
  /**
   * Where a specific encounter should be classified as a part of a specific episode(s) of care this field should be used. This association can facilitate grouping of related encounters together for a specific purpose, such as government reporting, issue tracking, association via a common problem.
   */
  episodeOfCare: Schema.optional(Schema.Array(Reference)),
  /**
   * The request this encounter satisfies (e.g. incoming referral or procedure request).
   */
  basedOn: Schema.optional(Schema.Array(Reference)),
  /**
   * The list of people responsible for providing the service.
   */
  participant: Schema.optional(Schema.Array(EncounterParticipant)),
  /**
   * The appointment that scheduled this encounter.
   */
  appointment: Schema.optional(Schema.Array(Reference)),
  /**
   * The start and end time of the encounter.
   */
  period: Schema.optional(Period),
  /**
   * Quantity of time the encounter lasted. This excludes the time during leaves of absence.
   */
  length: Schema.optional(SimpleQuantity),
  /**
   * Reason the encounter takes place, expressed as a code. For admissions, this can be used for a coded admission diagnosis.
   */
  reasonCode: Schema.optional(Schema.Array(CodeableConcept)),
  /**
   * Reason the encounter takes place, expressed as a reference to a Condition, Procedure, Observation, or ImmunizationRecommendation.
   */
  reasonReference: Schema.optional(Schema.Array(Reference)),
  /**
   * The list of diagnosis relevant to this encounter.
   */
  diagnosis: Schema.optional(Schema.Array(EncounterDiagnosis)),
  /**
   * The set of accounts that may be used for billing for this Encounter.
   */
  account: Schema.optional(Schema.Array(Reference)),
  /**
   * Details about the admission to a healthcare service.
   */
  hospitalization: Schema.optional(EncounterHospitalization),
  /**
   * List of locations where the patient has been during this encounter.
   */
  location: Schema.optional(Schema.Array(EncounterLocation)),
  /**
   * The organization that is primarily responsible for this Encounter's services. This MAY be the same as the organization on the Patient record, however it could be different, such as if the actor performing the services was from an external organization (which may be billed seperately) for an external consultation.
   */
  serviceProvider: Schema.optional(Reference),
  /**
   * Another Encounter of which this encounter is a part of (administratively or in time).
   */
  partOf: Schema.optional(Reference),
})

export type Encounter = typeof Encounter.Type
