import { Schema } from 'effect'
import type {
  Encounter as FhirEncounter,
  EncounterStatusHistory as FhirEncounterStatusHistory,
  EncounterClassHistory as FhirEncounterClassHistory,
  EncounterParticipant as FhirEncounterParticipant,
  EncounterDiagnosis as FhirEncounterDiagnosis,
  EncounterHospitalization as FhirEncounterHospitalization,
  EncounterLocation as FhirEncounterLocation,
} from 'fhir/r4'
import { Coding } from '../../data-types/complex/Coding'
import type { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { CodeableConceptFromFhirR4 } from '../../data-types/complex/CodeableConcept'
import type { DomainResource } from '../../data-types/base/DomainResource'
import { DomainResourceFromFhirR4 } from '../../data-types/base/DomainResource'
import type { BackboneElement } from '../../data-types/base/BackboneElement'
import { BackboneElementFromFhirR4 } from '../../data-types/base/BackboneElement'
import type {
  Reference,
  Identifier,
} from '../../data-types/complex/IdentifierAndReference'
import {
  ReferenceFromFhirR4,
  IdentifierFromFhirR4,
} from '../../data-types/complex/IdentifierAndReference'
import type { Period } from '../../data-types/complex/Period'
import { PeriodFromFhirR4 } from '../../data-types/complex/Period'
import { SimpleQuantity } from '../../data-types/complex/SimpleQuantity'
import type { DeepReadonly } from '@assessmentis/util'

export const EncounterId = Schema.String.pipe(Schema.brand('EncounterId'))

export type EncounterId = typeof EncounterId.Type

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
type EncounterStatus = typeof EncounterStatus.Type

const EncounterLocationStatus = Schema.Union(
  Schema.Literal('planned'),
  Schema.Literal('active'),
  Schema.Literal('reserved'),
  Schema.Literal('completed')
)
type EncounterLocationStatus = typeof EncounterLocationStatus.Type

// --- Sub-component IDs ---

const StatusHistoryId = Schema.String.pipe(Schema.brand('StatusHistoryId'))
type StatusHistoryId = typeof StatusHistoryId.Type

const ClassHistoryId = Schema.String.pipe(Schema.brand('ClassHistoryId'))
type ClassHistoryId = typeof ClassHistoryId.Type

const ParticipantId = Schema.String.pipe(Schema.brand('ParticipantId'))
type ParticipantId = typeof ParticipantId.Type

const DiagnosisId = Schema.String.pipe(Schema.brand('DiagnosisId'))
type DiagnosisId = typeof DiagnosisId.Type

const EncounterLocationId = Schema.String.pipe(
  Schema.brand('EncounterLocationId')
)
type EncounterLocationId = typeof EncounterLocationId.Type

const HospitalizationId = Schema.String.pipe(Schema.brand('HospitalizationId'))
type HospitalizationId = typeof HospitalizationId.Type

// --- Sub-component interfaces ---

interface EncounterStatusHistory extends BackboneElement<StatusHistoryId> {
  status: EncounterStatus
  period: Period
}

interface EncounterClassHistory extends BackboneElement<ClassHistoryId> {
  class: Coding
  period: Period
}

interface EncounterParticipant extends BackboneElement<ParticipantId> {
  type?: ReadonlyArray<CodeableConcept>
  period?: Period
  individual?: Reference
}

interface EncounterDiagnosis extends BackboneElement<DiagnosisId> {
  condition: Reference
  use?: CodeableConcept
  rank?: number
}

interface EncounterHospitalization extends BackboneElement<HospitalizationId> {
  preAdmissionIdentifier?: Identifier
  origin?: Reference
  admitSource?: CodeableConcept
  reAdmission?: CodeableConcept
  dietPreference?: ReadonlyArray<CodeableConcept>
  specialCourtesy?: ReadonlyArray<CodeableConcept>
  specialArrangement?: ReadonlyArray<CodeableConcept>
  destination?: Reference
  dischargeDisposition?: CodeableConcept
}

interface EncounterLocation extends BackboneElement<EncounterLocationId> {
  location: Reference
  status?: EncounterLocationStatus
  physicalType?: CodeableConcept
  period?: Period
}

// --- Sub-component schemas ---

const EncounterStatusHistoryFromFhirR4: Schema.Schema<
  EncounterStatusHistory,
  DeepReadonly<FhirEncounterStatusHistory>,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(StatusHistoryId),
  Schema.Struct({
    status: EncounterStatus,
    period: Schema.suspend(() => PeriodFromFhirR4),
  })
)

const EncounterClassHistoryFromFhirR4: Schema.Schema<
  EncounterClassHistory,
  DeepReadonly<FhirEncounterClassHistory>,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(ClassHistoryId),
  Schema.Struct({
    class: Schema.suspend(() => Coding),
    period: Schema.suspend(() => PeriodFromFhirR4),
  })
)

const EncounterParticipantFromFhirR4: Schema.Schema<
  EncounterParticipant,
  DeepReadonly<FhirEncounterParticipant>,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(ParticipantId),
  Schema.Struct({
    type: Schema.optional(
      Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
    ),
    period: Schema.optional(Schema.suspend(() => PeriodFromFhirR4)),
    individual: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
  })
)

const EncounterDiagnosisFromFhirR4: Schema.Schema<
  EncounterDiagnosis,
  DeepReadonly<FhirEncounterDiagnosis>,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(DiagnosisId),
  Schema.Struct({
    condition: Schema.suspend(() => ReferenceFromFhirR4),
    use: Schema.optional(Schema.suspend(() => CodeableConceptFromFhirR4)),
    rank: Schema.optional(Schema.Int.pipe(Schema.positive())),
  })
)

const EncounterHospitalizationFromFhirR4: Schema.Schema<
  EncounterHospitalization,
  DeepReadonly<FhirEncounterHospitalization>,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(HospitalizationId),
  Schema.Struct({
    preAdmissionIdentifier: Schema.optional(
      Schema.suspend(() => IdentifierFromFhirR4)
    ),
    origin: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
    admitSource: Schema.optional(
      Schema.suspend(() => CodeableConceptFromFhirR4)
    ),
    reAdmission: Schema.optional(
      Schema.suspend(() => CodeableConceptFromFhirR4)
    ),
    dietPreference: Schema.optional(
      Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
    ),
    specialCourtesy: Schema.optional(
      Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
    ),
    specialArrangement: Schema.optional(
      Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
    ),
    destination: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
    dischargeDisposition: Schema.optional(
      Schema.suspend(() => CodeableConceptFromFhirR4)
    ),
  })
)

const EncounterLocationFromFhirR4: Schema.Schema<
  EncounterLocation,
  DeepReadonly<FhirEncounterLocation>,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(EncounterLocationId),
  Schema.Struct({
    location: Schema.suspend(() => ReferenceFromFhirR4),
    status: Schema.optional(EncounterLocationStatus),
    physicalType: Schema.optional(
      Schema.suspend(() => CodeableConceptFromFhirR4)
    ),
    period: Schema.optional(Schema.suspend(() => PeriodFromFhirR4)),
  })
)

// --- Encounter ---

/**
 * An interaction between a patient and healthcare provider(s) for the purpose of
 * providing healthcare service(s) or assessing the health status of a patient.
 */
export interface Encounter extends DomainResource<EncounterId> {
  resourceType: 'Encounter'
  identifier?: ReadonlyArray<Identifier>
  status: EncounterStatus
  statusHistory?: ReadonlyArray<EncounterStatusHistory>
  class: Coding
  classHistory?: ReadonlyArray<EncounterClassHistory>
  type?: ReadonlyArray<CodeableConcept>
  serviceType?: CodeableConcept
  priority?: CodeableConcept
  subject?: Reference
  episodeOfCare?: ReadonlyArray<Reference>
  basedOn?: ReadonlyArray<Reference>
  participant?: ReadonlyArray<EncounterParticipant>
  appointment?: ReadonlyArray<Reference>
  period?: Period
  length?: SimpleQuantity
  reasonCode?: ReadonlyArray<CodeableConcept>
  reasonReference?: ReadonlyArray<Reference>
  diagnosis?: ReadonlyArray<EncounterDiagnosis>
  account?: ReadonlyArray<Reference>
  hospitalization?: EncounterHospitalization
  location?: ReadonlyArray<EncounterLocation>
  serviceProvider?: Reference
  partOf?: Reference
}

/**
 * Schema for transforming between Encounter Data objects and FHIR R4 Encounter resources.
 */
export const EncounterFromFhirR4: Schema.Schema<
  Encounter,
  DeepReadonly<FhirEncounter>,
  never
> = Schema.extend(
  DomainResourceFromFhirR4(EncounterId),
  Schema.Struct({
    resourceType: Schema.Literal('Encounter'),
    identifier: Schema.optional(
      Schema.Array(Schema.suspend(() => IdentifierFromFhirR4))
    ),
    status: EncounterStatus,
    statusHistory: Schema.optional(
      Schema.Array(EncounterStatusHistoryFromFhirR4)
    ),
    class: Schema.suspend(() => Coding),
    classHistory: Schema.optional(
      Schema.Array(EncounterClassHistoryFromFhirR4)
    ),
    type: Schema.optional(
      Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
    ),
    serviceType: Schema.optional(
      Schema.suspend(() => CodeableConceptFromFhirR4)
    ),
    priority: Schema.optional(Schema.suspend(() => CodeableConceptFromFhirR4)),
    subject: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
    episodeOfCare: Schema.optional(
      Schema.Array(Schema.suspend(() => ReferenceFromFhirR4))
    ),
    basedOn: Schema.optional(
      Schema.Array(Schema.suspend(() => ReferenceFromFhirR4))
    ),
    participant: Schema.optional(Schema.Array(EncounterParticipantFromFhirR4)),
    appointment: Schema.optional(
      Schema.Array(Schema.suspend(() => ReferenceFromFhirR4))
    ),
    period: Schema.optional(Schema.suspend(() => PeriodFromFhirR4)),
    length: Schema.optional(Schema.suspend(() => SimpleQuantity)),
    reasonCode: Schema.optional(
      Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
    ),
    reasonReference: Schema.optional(
      Schema.Array(Schema.suspend(() => ReferenceFromFhirR4))
    ),
    diagnosis: Schema.optional(Schema.Array(EncounterDiagnosisFromFhirR4)),
    account: Schema.optional(
      Schema.Array(Schema.suspend(() => ReferenceFromFhirR4))
    ),
    hospitalization: Schema.optional(EncounterHospitalizationFromFhirR4),
    location: Schema.optional(Schema.Array(EncounterLocationFromFhirR4)),
    serviceProvider: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
    partOf: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
  })
)
