import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { FhirR4ResourceBehaviourImpl } from '../../FhirR4ResourceBehaviour'
import type {
  Encounter,
  EncounterStatusHistory,
  EncounterClassHistory,
  EncounterParticipant,
  EncounterDiagnosis,
  EncounterHospitalization,
  EncounterLocation,
} from '@assessmentis/clinical-domain/administration'
import { EncounterId } from '@assessmentis/clinical-domain/administration'
import { FhirR4DomainResource } from '../../data-types/base/DomainResource'
import { FhirR4BackboneElement } from '../../data-types/base/BackboneElement'
import { FhirR4Coding } from '../../data-types/complex/Coding'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { FhirR4Period } from '../../data-types/complex/Period'
import { FhirR4Quantity } from '../../data-types/complex/Quantity'

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

// --- Sub-component IDs ---

const StatusHistoryId = Schema.String.pipe(Schema.brand('StatusHistoryId'))
const ClassHistoryId = Schema.String.pipe(Schema.brand('ClassHistoryId'))
const ParticipantId = Schema.String.pipe(Schema.brand('ParticipantId'))
const DiagnosisId = Schema.String.pipe(Schema.brand('DiagnosisId'))
const EncounterLocationId = Schema.String.pipe(
  Schema.brand('EncounterLocationId')
)
const HospitalizationId = Schema.String.pipe(Schema.brand('HospitalizationId'))

// --- Sub-component schemas ---

const FhirR4EncounterStatusHistorySchema: Schema.Schema<
  EncounterStatusHistory,
  FhirR4.EncounterStatusHistory,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(StatusHistoryId),
  Schema.mutable(
    Schema.Struct({
      status: EncounterStatus,
      period: Schema.suspend(() => FhirR4Period.Schema),
    })
  )
)

const FhirR4EncounterClassHistorySchema: Schema.Schema<
  EncounterClassHistory,
  FhirR4.EncounterClassHistory,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(ClassHistoryId),
  Schema.Struct({
    class: Schema.suspend(() => FhirR4Coding.Schema),
    period: Schema.suspend(() => FhirR4Period.Schema),
  })
)

const FhirR4EncounterParticipantSchema: Schema.Schema<
  EncounterParticipant,
  FhirR4.EncounterParticipant,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(ParticipantId),
  Schema.Struct({
    type: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
      )
    ),
    period: Schema.optional(Schema.suspend(() => FhirR4Period.Schema)),
    individual: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
  })
)

const FhirR4EncounterDiagnosisSchema: Schema.Schema<
  EncounterDiagnosis,
  FhirR4.EncounterDiagnosis,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(DiagnosisId),
  Schema.Struct({
    condition: Schema.suspend(() => FhirR4Reference.Schema),
    use: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.Schema)),
    rank: Schema.optional(Schema.Int.pipe(Schema.positive())),
  })
)

const FhirR4EncounterHospitalizationSchema: Schema.Schema<
  EncounterHospitalization,
  FhirR4.EncounterHospitalization,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(HospitalizationId),
  Schema.Struct({
    preAdmissionIdentifier: Schema.optional(
      Schema.suspend(() => FhirR4Identifier.Schema)
    ),
    origin: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
    admitSource: Schema.optional(
      Schema.suspend(() => FhirR4CodeableConcept.Schema)
    ),
    reAdmission: Schema.optional(
      Schema.suspend(() => FhirR4CodeableConcept.Schema)
    ),
    dietPreference: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
      )
    ),
    specialCourtesy: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
      )
    ),
    specialArrangement: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
      )
    ),
    destination: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
    dischargeDisposition: Schema.optional(
      Schema.suspend(() => FhirR4CodeableConcept.Schema)
    ),
  })
)

const FhirR4EncounterLocationSchema: Schema.Schema<
  EncounterLocation,
  FhirR4.EncounterLocation,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(EncounterLocationId),
  Schema.Struct({
    location: Schema.suspend(() => FhirR4Reference.Schema),
    status: Schema.optional(EncounterLocationStatus),
    physicalType: Schema.optional(
      Schema.suspend(() => FhirR4CodeableConcept.Schema)
    ),
    period: Schema.optional(Schema.suspend(() => FhirR4Period.Schema)),
  })
)

// --- Encounter ---

const FhirR4EncounterSchema: Schema.Schema<Encounter, FhirR4.Encounter, never> =
  Schema.extend(
    FhirR4DomainResource.Schema(EncounterId),
    Schema.Struct({
      resourceType: Schema.Literal('Encounter'),
      identifier: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Identifier.Schema))
        )
      ),
      status: EncounterStatus,
      statusHistory: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4EncounterStatusHistorySchema))
      ),
      class: Schema.suspend(() => FhirR4Coding.Schema),
      classHistory: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4EncounterClassHistorySchema))
      ),
      type: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
        )
      ),
      serviceType: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.Schema)
      ),
      priority: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.Schema)
      ),
      subject: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
      episodeOfCare: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
        )
      ),
      basedOn: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
        )
      ),
      participant: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4EncounterParticipantSchema))
      ),
      appointment: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
        )
      ),
      period: Schema.optional(Schema.suspend(() => FhirR4Period.Schema)),
      length: Schema.optional(Schema.suspend(() => FhirR4Quantity.Schema)),
      reasonCode: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
        )
      ),
      reasonReference: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
        )
      ),
      diagnosis: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4EncounterDiagnosisSchema))
      ),
      account: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
        )
      ),
      hospitalization: Schema.optional(FhirR4EncounterHospitalizationSchema),
      location: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4EncounterLocationSchema))
      ),
      serviceProvider: Schema.optional(
        Schema.suspend(() => FhirR4Reference.Schema)
      ),
      partOf: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
    })
  )

export const FhirR4Encounter = FhirR4ResourceBehaviourImpl({
  resourceType: 'Encounter',
  Schema: FhirR4EncounterSchema,
})
