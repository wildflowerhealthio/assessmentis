import { Schema } from 'effect'

import {
  Observation,
  ObservationStatus,
  type ObservationEncoded,
} from '@assessmentis/clinical-domain'
import {
  AllDatatypeKeys,
  DatatypeChoiceEncodedPassthroughFields,
} from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded, TwoStepExternalSchema } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import { FhirR4Annotation } from '../../data-types/complex/Annotation'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { FhirR4Period } from '../../data-types/complex/Period'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import { ObservationComponentEncodedFromFhir } from './ObservationComponent'
import { ObservationReferenceRangeEncodedFromFhir } from './ObservationReferenceRange'

const EncodedFromFhir: Schema.Schema<
  ObservationEncoded,
  FhirR4.Observation,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Observation', 'Observation'),
  mutableEncoded(
    Schema.Struct({
      identifier: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)
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
      partOf: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
          )
        )
      ),
      status: ObservationStatus,
      category: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
          )
        )
      ),
      code: Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal),
      subject: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      focus: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
          )
        )
      ),
      encounter: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      effectiveDateTime: Schema.optional(Schema.String),
      effectivePeriod: Schema.optional(
        Schema.suspend(() => FhirR4Period.EncodedFromExternal)
      ),
      effectiveInstant: Schema.optional(Schema.String),
      issued: Schema.optional(Schema.String),
      performer: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
          )
        )
      ),
      dataAbsentReason: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      interpretation: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
          )
        )
      ),
      note: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Annotation.EncodedFromExternal)
          )
        )
      ),
      bodySite: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      method: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      specimen: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      device: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      referenceRange: Schema.optional(
        mutableEncoded(Schema.Array(ObservationReferenceRangeEncodedFromFhir))
      ),
      hasMember: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
          )
        )
      ),
      derivedFrom: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
          )
        )
      ),
      component: Schema.optional(
        mutableEncoded(Schema.Array(ObservationComponentEncodedFromFhir))
      ),
      ...DatatypeChoiceEncodedPassthroughFields('value', AllDatatypeKeys),
    })
  )
)

export const FhirR4Observation = new TwoStepExternalSchema<
  Observation,
  ObservationEncoded,
  FhirR4.Observation,
  BaseUrl
>(Observation, EncodedFromFhir)
