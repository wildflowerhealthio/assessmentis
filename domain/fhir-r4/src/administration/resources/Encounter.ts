import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Encounter,
  type EncounterEncoded,
} from '@assessmentis/clinical-domain'
import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { CodingEncodedFromFhir } from '../../data-types/complex/Coding'
import { CodeableConceptEncodedFromFhir } from '../../data-types/complex/CodeableConcept'
import {
  IdentifierEncodedFromFhir,
  ReferenceEncodedFromFhir,
} from '../../data-types/complex/IdentifierAndReference'
import { PeriodEncodedFromFhir } from '../../data-types/complex/Period'
import { QuantityEncodedFromFhir } from '../../data-types/complex/Quantity'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

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

const EncounterStatusHistoryEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('EncounterStatusHistory'),
  mutableEncoded(
    Schema.Struct({
      status: EncounterStatus,
      period: Schema.suspend(() => PeriodEncodedFromFhir),
    })
  )
)

const EncounterClassHistoryEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('EncounterClassHistory'),
  mutableEncoded(
    Schema.Struct({
      class: Schema.suspend(() => CodingEncodedFromFhir),
      period: Schema.suspend(() => PeriodEncodedFromFhir),
    })
  )
)

const EncounterParticipantEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('EncounterParticipant'),
  mutableEncoded(
    Schema.Struct({
      type: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      period: Schema.optional(Schema.suspend(() => PeriodEncodedFromFhir)),
      individual: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
    })
  )
)

const EncounterDiagnosisEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('EncounterDiagnosis'),
  mutableEncoded(
    Schema.Struct({
      condition: Schema.suspend(() => ReferenceEncodedFromFhir),
      use: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      rank: Schema.optional(Schema.Number),
    })
  )
)

const EncounterHospitalizationEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('EncounterHospitalization'),
  mutableEncoded(
    Schema.Struct({
      preAdmissionIdentifier: Schema.optional(
        Schema.suspend(() => IdentifierEncodedFromFhir)
      ),
      origin: Schema.optional(Schema.suspend(() => ReferenceEncodedFromFhir)),
      admitSource: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      reAdmission: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      dietPreference: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      specialCourtesy: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      specialArrangement: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      destination: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      dischargeDisposition: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
    })
  )
)

const EncounterLocationEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('EncounterLocation'),
  mutableEncoded(
    Schema.Struct({
      location: Schema.suspend(() => ReferenceEncodedFromFhir),
      status: Schema.optional(EncounterLocationStatus),
      physicalType: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      period: Schema.optional(Schema.suspend(() => PeriodEncodedFromFhir)),
    })
  )
)

// --- Encounter ---

const FhirR4EncounterEncodedFromFhir: Schema.Schema<
  EncounterEncoded,
  FhirR4.Encounter,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Encounter', 'Encounter'),
  mutableEncoded(
    Schema.Struct({
      identifier: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => IdentifierEncodedFromFhir))
        )
      ),
      status: EncounterStatus,
      statusHistory: Schema.optional(
        mutableEncoded(Schema.Array(EncounterStatusHistoryEncodedFromFhir))
      ),
      class: Schema.suspend(() => CodingEncodedFromFhir),
      classHistory: Schema.optional(
        mutableEncoded(Schema.Array(EncounterClassHistoryEncodedFromFhir))
      ),
      type: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      serviceType: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      priority: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      subject: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      episodeOfCare: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      basedOn: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      participant: Schema.optional(
        mutableEncoded(Schema.Array(EncounterParticipantEncodedFromFhir))
      ),
      appointment: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      period: Schema.optional(Schema.suspend(() => PeriodEncodedFromFhir)),
      length: Schema.optional(Schema.suspend(() => QuantityEncodedFromFhir)),
      reasonCode: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      reasonReference: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      diagnosis: Schema.optional(
        mutableEncoded(Schema.Array(EncounterDiagnosisEncodedFromFhir))
      ),
      account: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      hospitalization: Schema.optional(
        EncounterHospitalizationEncodedFromFhir
      ),
      location: Schema.optional(
        mutableEncoded(Schema.Array(EncounterLocationEncodedFromFhir))
      ),
      serviceProvider: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      partOf: Schema.optional(Schema.suspend(() => ReferenceEncodedFromFhir)),
    })
  )
)

export const FhirR4Encounter = {
  resourceType: 'Encounter',
  Schema: Schema.compose(FhirR4EncounterEncodedFromFhir, Encounter),
}
