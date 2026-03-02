import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { Encounter, type EncounterEncoded } from '@assessmentis/clinical-domain'
import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import { FhirR4Coding } from '../../data-types/complex/Coding'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { FhirR4Period } from '../../data-types/complex/Period'
import { FhirR4Quantity } from '../../data-types/complex/Quantity'
import {
  EncounterStatus,
  EncounterStatusHistoryEncodedFromFhir,
} from './EncounterStatusHistory'
import { EncounterClassHistoryEncodedFromFhir } from './EncounterClassHistory'
import { EncounterParticipantEncodedFromFhir } from './EncounterParticipant'
import { EncounterDiagnosisEncodedFromFhir } from './EncounterDiagnosis'
import { EncounterHospitalizationEncodedFromFhir } from './EncounterHospitalization'
import { EncounterLocationEncodedFromFhir } from './EncounterLocation'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'
import { TwoStepExternalSchema } from '@assessmentis/util'

const EncodedFromFhir: Schema.Schema<
  EncounterEncoded,
  FhirR4.Encounter,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Encounter', 'Encounter'),
  mutableEncoded(
    Schema.Struct({
      identifier: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)
          )
        )
      ),
      status: EncounterStatus,
      statusHistory: Schema.optional(
        mutableEncoded(Schema.Array(EncounterStatusHistoryEncodedFromFhir))
      ),
      class: Schema.suspend(() => FhirR4Coding.EncodedFromExternal),
      classHistory: Schema.optional(
        mutableEncoded(Schema.Array(EncounterClassHistoryEncodedFromFhir))
      ),
      type: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
          )
        )
      ),
      serviceType: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      priority: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      subject: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      episodeOfCare: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
          )
        )
      ),
      basedOn: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
          )
        )
      ),
      participant: Schema.optional(
        mutableEncoded(Schema.Array(EncounterParticipantEncodedFromFhir))
      ),
      appointment: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
          )
        )
      ),
      period: Schema.optional(
        Schema.suspend(() => FhirR4Period.EncodedFromExternal)
      ),
      length: Schema.optional(
        Schema.suspend(() => FhirR4Quantity.EncodedFromExternal)
      ),
      reasonCode: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
          )
        )
      ),
      reasonReference: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
          )
        )
      ),
      diagnosis: Schema.optional(
        mutableEncoded(Schema.Array(EncounterDiagnosisEncodedFromFhir))
      ),
      account: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
          )
        )
      ),
      hospitalization: Schema.optional(EncounterHospitalizationEncodedFromFhir),
      location: Schema.optional(
        mutableEncoded(Schema.Array(EncounterLocationEncodedFromFhir))
      ),
      serviceProvider: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      partOf: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
    })
  )
)

export const FhirR4Encounter = new TwoStepExternalSchema<
  Encounter,
  EncounterEncoded,
  FhirR4.Encounter,
  BaseUrl
>(Encounter, EncodedFromFhir)
