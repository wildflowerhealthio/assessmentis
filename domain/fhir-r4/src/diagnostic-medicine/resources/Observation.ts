import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Observation,
  type ObservationEncoded,
  ObservationStatus,
} from '@assessmentis/clinical-domain'
import {
  AllDatatypeKeys,
  DatatypeChoiceEncodedPassthroughFields,
} from '@assessmentis/clinical-domain/data-types'
import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import {
  IdentifierEncodedFromFhir,
  ReferenceEncodedFromFhir,
} from '../../data-types/complex/IdentifierAndReference'
import { CodeableConceptEncodedFromFhir } from '../../data-types/complex/CodeableConcept'
import { AnnotationEncodedFromFhir } from '../../data-types/complex/Annotation'
import { PeriodEncodedFromFhir } from '../../data-types/complex/Period'
import { QuantityEncodedFromFhir } from '../../data-types/complex/Quantity'
import { RangeEncodedFromFhir } from '../../data-types/complex/Range'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

// --- Sub-component schemas ---

const ObservationReferenceRangeEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('ObservationReferenceRange'),
  mutableEncoded(
    Schema.Struct({
      low: Schema.optional(Schema.suspend(() => QuantityEncodedFromFhir)),
      high: Schema.optional(Schema.suspend(() => QuantityEncodedFromFhir)),
      type: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      appliesTo: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      age: Schema.optional(Schema.suspend(() => RangeEncodedFromFhir)),
      text: Schema.optional(Schema.String),
    })
  )
)

const ObservationComponentEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('ObservationComponent'),
  mutableEncoded(
    Schema.Struct({
      code: Schema.suspend(() => CodeableConceptEncodedFromFhir),
      dataAbsentReason: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      interpretation: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      referenceRange: Schema.optional(
        mutableEncoded(Schema.Array(ObservationReferenceRangeEncodedFromFhir))
      ),
      ...DatatypeChoiceEncodedPassthroughFields('value', AllDatatypeKeys),
    })
  )
)

// --- Observation ---

const FhirR4ObservationEncodedFromFhir: Schema.Schema<
  ObservationEncoded,
  FhirR4.Observation,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Observation', 'Observation'),
  mutableEncoded(
    Schema.Struct({
      identifier: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => IdentifierEncodedFromFhir))
        )
      ),
      basedOn: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      partOf: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      status: ObservationStatus,
      category: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      code: Schema.suspend(() => CodeableConceptEncodedFromFhir),
      subject: Schema.optional(Schema.suspend(() => ReferenceEncodedFromFhir)),
      focus: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      encounter: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      effectiveDateTime: Schema.optional(Schema.String),
      effectivePeriod: Schema.optional(
        Schema.suspend(() => PeriodEncodedFromFhir)
      ),
      effectiveInstant: Schema.optional(Schema.String),
      issued: Schema.optional(Schema.String),
      performer: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      dataAbsentReason: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      interpretation: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      note: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => AnnotationEncodedFromFhir))
        )
      ),
      bodySite: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      method: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      specimen: Schema.optional(Schema.suspend(() => ReferenceEncodedFromFhir)),
      device: Schema.optional(Schema.suspend(() => ReferenceEncodedFromFhir)),
      referenceRange: Schema.optional(
        mutableEncoded(Schema.Array(ObservationReferenceRangeEncodedFromFhir))
      ),
      hasMember: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      derivedFrom: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      component: Schema.optional(
        mutableEncoded(Schema.Array(ObservationComponentEncodedFromFhir))
      ),
      ...DatatypeChoiceEncodedPassthroughFields('value', AllDatatypeKeys),
    })
  )
)

export const FhirR4Observation = {
  resourceType: 'Observation',
  Schema: Schema.compose(FhirR4ObservationEncodedFromFhir, Observation),
}
