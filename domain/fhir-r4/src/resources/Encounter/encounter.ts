import { Schema } from 'effect'

import { Encounter } from '@assessmentis/clinical-domain'
import type { EncounterEncoded } from '@assessmentis/clinical-domain'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/resource'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import { FhirR4Coding } from '../../data-types/complex/coding'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/identifier-and-reference'
import { FhirR4Period } from '../../data-types/complex/period'
import { FhirR4Quantity } from '../../data-types/complex/quantity'
import type { BaseUrl } from '../../data-types/url-identification'
import { EncounterClassHistoryEncodedFromFhir } from './encounter-class-history'
import { EncounterDiagnosisEncodedFromFhir } from './encounter-diagnosis'
import { EncounterHospitalizationEncodedFromFhir } from './encounter-hospitalization'
import { EncounterLocationEncodedFromFhir } from './encounter-location'
import { EncounterParticipantEncodedFromFhir } from './encounter-participant'
import { EncounterStatus, EncounterStatusHistoryEncodedFromFhir } from './encounter-status-history'

const EncodedFromFhir: Schema.Schema<EncounterEncoded, FhirR4.Encounter, BaseUrl> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Encounter', 'Encounter'),
  mutableEncoded(
    Schema.Struct({
      account: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
      ),
      appointment: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
      ),
      basedOn: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
      ),
      class: Schema.suspend(() => FhirR4Coding.EncodedFromExternal),
      classHistory: Schema.optional(
        mutableEncoded(Schema.Array(EncounterClassHistoryEncodedFromFhir))
      ),
      diagnosis: Schema.optional(mutableEncoded(Schema.Array(EncounterDiagnosisEncodedFromFhir))),
      episodeOfCare: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
      ),
      hospitalization: Schema.optional(EncounterHospitalizationEncodedFromFhir),
      identifier: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)))
      ),
      length: Schema.optional(Schema.suspend(() => FhirR4Quantity.EncodedFromExternal)),
      location: Schema.optional(mutableEncoded(Schema.Array(EncounterLocationEncodedFromFhir))),
      partOf: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
      participant: Schema.optional(
        mutableEncoded(Schema.Array(EncounterParticipantEncodedFromFhir))
      ),
      period: Schema.optional(Schema.suspend(() => FhirR4Period.EncodedFromExternal)),
      priority: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
      reasonCode: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
        )
      ),
      reasonReference: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
      ),
      serviceProvider: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
      serviceType: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
      status: EncounterStatus,
      statusHistory: Schema.optional(
        mutableEncoded(Schema.Array(EncounterStatusHistoryEncodedFromFhir))
      ),
      subject: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
      type: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
        )
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
