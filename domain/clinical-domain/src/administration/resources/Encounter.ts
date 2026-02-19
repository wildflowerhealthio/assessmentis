import { pipe, Schema } from 'effect'
import { ClinicalResourceBehaviourImpl } from '../../ClinicalResourceBehaviour'
import { Coding } from '../../data-types/complex/Coding'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { DomainResource } from '../../data-types/base/DomainResource'
import { BackboneElement } from '../../data-types/base/BackboneElement'
import {
  Reference,
  Identifier,
} from '../../data-types/complex/IdentifierAndReference'
import { Period } from '../../data-types/complex/Period'
import { Quantity } from '../../data-types/complex/Quantity'
import { WithSymbolTag } from '@assessmentis/util'
import { Resource } from '@assessmentis/effectful-store'

const ResourceSymbol: unique symbol = Symbol.for(
  '@assessmentis/clinical-domain/Encounter'
)
type ResourceSymbol = typeof ResourceSymbol

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

export interface EncounterStatusHistory extends BackboneElement<StatusHistoryId> {
  status: EncounterStatus
  period: Period
}

export interface EncounterClassHistory extends BackboneElement<ClassHistoryId> {
  class: Coding
  period: Period
}

export interface EncounterParticipant extends BackboneElement<ParticipantId> {
  type?: CodeableConcept[]
  period?: Period
  individual?: Reference
}

export interface EncounterDiagnosis extends BackboneElement<DiagnosisId> {
  condition: Reference
  use?: CodeableConcept
  rank?: number
}

export interface EncounterHospitalization extends BackboneElement<HospitalizationId> {
  preAdmissionIdentifier?: Identifier
  origin?: Reference
  admitSource?: CodeableConcept
  reAdmission?: CodeableConcept
  dietPreference?: CodeableConcept[]
  specialCourtesy?: CodeableConcept[]
  specialArrangement?: CodeableConcept[]
  destination?: Reference
  dischargeDisposition?: CodeableConcept
}

export interface EncounterLocation extends BackboneElement<EncounterLocationId> {
  location: Reference
  status?: EncounterLocationStatus
  physicalType?: CodeableConcept
  period?: Period
}

// --- Sub-component schemas ---

const EncounterStatusHistorySchema = Schema.extend(
  BackboneElement.Schema(StatusHistoryId),
  Schema.mutable(
    Schema.Struct({
      status: EncounterStatus,
      period: Schema.suspend(() => Period.Schema),
    })
  )
)

const EncounterClassHistorySchema = Schema.extend(
  BackboneElement.Schema(ClassHistoryId),
  Schema.Struct({
    class: Schema.suspend(() => Coding.Schema),
    period: Schema.suspend(() => Period.Schema),
  })
)

const EncounterParticipantSchema = Schema.extend(
  BackboneElement.Schema(ParticipantId),
  Schema.Struct({
    type: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => CodeableConcept.Schema)))
    ),
    period: Schema.optional(Schema.suspend(() => Period.Schema)),
    individual: Schema.optional(Schema.suspend(() => Reference.Schema)),
  })
)

const EncounterDiagnosisSchema = Schema.extend(
  BackboneElement.Schema(DiagnosisId),
  Schema.Struct({
    condition: Schema.suspend(() => Reference.Schema),
    use: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
    rank: Schema.optional(Schema.Int.pipe(Schema.positive())),
  })
)

const EncounterHospitalizationSchema = Schema.extend(
  BackboneElement.Schema(HospitalizationId),
  Schema.Struct({
    preAdmissionIdentifier: Schema.optional(
      Schema.suspend(() => Identifier.Schema)
    ),
    origin: Schema.optional(Schema.suspend(() => Reference.Schema)),
    admitSource: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
    reAdmission: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
    dietPreference: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => CodeableConcept.Schema)))
    ),
    specialCourtesy: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => CodeableConcept.Schema)))
    ),
    specialArrangement: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => CodeableConcept.Schema)))
    ),
    destination: Schema.optional(Schema.suspend(() => Reference.Schema)),
    dischargeDisposition: Schema.optional(
      Schema.suspend(() => CodeableConcept.Schema)
    ),
  })
)

const EncounterLocationSchema = Schema.extend(
  BackboneElement.Schema(EncounterLocationId),
  Schema.Struct({
    location: Schema.suspend(() => Reference.Schema),
    status: Schema.optional(EncounterLocationStatus),
    physicalType: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
    period: Schema.optional(Schema.suspend(() => Period.Schema)),
  })
)

// --- Encounter ---

/**
 * An interaction between a patient and healthcare provider(s) for the purpose of
 * providing healthcare service(s) or assessing the health status of a patient.
 */
export interface Encounter
  extends
    DomainResource<EncounterId>,
    Resource.Resource<ResourceSymbol, Resource.ReadonlyUrl> {
  [Resource.ResourceType]: ResourceSymbol
  resourceType: 'Encounter'
  identifier?: Identifier[]
  status: EncounterStatus
  statusHistory?: EncounterStatusHistory[]
  class: Coding
  classHistory?: EncounterClassHistory[]
  type?: CodeableConcept[]
  serviceType?: CodeableConcept
  priority?: CodeableConcept
  subject?: Reference
  episodeOfCare?: Reference[]
  basedOn?: Reference[]
  participant?: EncounterParticipant[]
  appointment?: Reference[]
  period?: Period
  length?: Quantity
  reasonCode?: CodeableConcept[]
  reasonReference?: Reference[]
  diagnosis?: EncounterDiagnosis[]
  account?: Reference[]
  hospitalization?: EncounterHospitalization
  location?: EncounterLocation[]
  serviceProvider?: Reference
  partOf?: Reference
}

const EncounterSchema = pipe(
  DomainResource.Schema(EncounterId),
  WithSymbolTag(Resource.ResourceType, ResourceSymbol),
  Schema.extend(
    Schema.Struct({
      resourceType: Schema.Literal('Encounter'),
      identifier: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Identifier.Schema)))
      ),
      status: EncounterStatus,
      statusHistory: Schema.optional(
        Schema.mutable(Schema.Array(EncounterStatusHistorySchema))
      ),
      class: Schema.suspend(() => Coding.Schema),
      classHistory: Schema.optional(
        Schema.mutable(Schema.Array(EncounterClassHistorySchema))
      ),
      type: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => CodeableConcept.Schema))
        )
      ),
      serviceType: Schema.optional(
        Schema.suspend(() => CodeableConcept.Schema)
      ),
      priority: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
      subject: Schema.optional(Schema.suspend(() => Reference.Schema)),
      episodeOfCare: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      basedOn: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      participant: Schema.optional(
        Schema.mutable(Schema.Array(EncounterParticipantSchema))
      ),
      appointment: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      period: Schema.optional(Schema.suspend(() => Period.Schema)),
      length: Schema.optional(Schema.suspend(() => Quantity.Schema)),
      reasonCode: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => CodeableConcept.Schema))
        )
      ),
      reasonReference: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      diagnosis: Schema.optional(
        Schema.mutable(Schema.Array(EncounterDiagnosisSchema))
      ),
      account: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      hospitalization: Schema.optional(EncounterHospitalizationSchema),
      location: Schema.optional(
        Schema.mutable(Schema.Array(EncounterLocationSchema))
      ),
      serviceProvider: Schema.optional(Schema.suspend(() => Reference.Schema)),
      partOf: Schema.optional(Schema.suspend(() => Reference.Schema)),
    })
  )
)

type EncounterEncoded = Schema.Schema.Encoded<typeof EncounterSchema>

/**
 * Schema for transforming between Encounter Data objects and FHIR R4 Encounter resources.
 */
export const Encounter = ClinicalResourceBehaviourImpl<
  Encounter,
  EncounterEncoded
>({
  ResourceSymbol,
  resourceType: 'Encounter',
  Schema: EncounterSchema,
})
