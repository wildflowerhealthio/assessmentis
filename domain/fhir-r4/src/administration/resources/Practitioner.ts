import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Practitioner,
  type PractitionerEncoded,
} from '@assessmentis/clinical-domain'
import { AdministrativeGender } from '@assessmentis/clinical-domain/data-types'
import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import {
  IdentifierEncodedFromFhir,
  ReferenceEncodedFromFhir,
} from '../../data-types/complex/IdentifierAndReference'
import { HumanNameEncodedFromFhir } from '../../data-types/complex/HumanName'
import { ContactPointEncodedFromFhir } from '../../data-types/complex/ContactPoint'
import { AddressEncodedFromFhir } from '../../data-types/complex/Address'
import { AttachmentEncodedFromFhir } from '../../data-types/complex/Attachment'
import { CodeableConceptEncodedFromFhir } from '../../data-types/complex/CodeableConcept'
import { PeriodEncodedFromFhir } from '../../data-types/complex/Period'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

// --- Sub-component ---

const PractitionerQualificationEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('PractitionerQualification'),
  mutableEncoded(
    Schema.Struct({
      identifier: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => IdentifierEncodedFromFhir))
        )
      ),
      code: Schema.suspend(() => CodeableConceptEncodedFromFhir),
      period: Schema.optional(Schema.suspend(() => PeriodEncodedFromFhir)),
      issuer: Schema.optional(Schema.suspend(() => ReferenceEncodedFromFhir)),
    })
  )
)

// --- Practitioner ---

const FhirR4PractitionerEncodedFromFhir: Schema.Schema<
  PractitionerEncoded,
  FhirR4.Practitioner,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Practitioner', 'Practitioner'),
  mutableEncoded(
    Schema.Struct({
      identifier: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => IdentifierEncodedFromFhir))
        )
      ),
      active: Schema.optional(Schema.Boolean),
      name: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => HumanNameEncodedFromFhir))
        )
      ),
      telecom: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ContactPointEncodedFromFhir))
        )
      ),
      address: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => AddressEncodedFromFhir))
        )
      ),
      gender: Schema.optional(AdministrativeGender.AdministrativeGender),
      birthDate: Schema.optional(Schema.String),
      photo: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => AttachmentEncodedFromFhir))
        )
      ),
      qualification: Schema.optional(
        mutableEncoded(Schema.Array(PractitionerQualificationEncodedFromFhir))
      ),
      communication: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
    })
  )
)

export const FhirR4Practitioner = {
  resourceType: 'Practitioner',
  Schema: Schema.compose(FhirR4PractitionerEncodedFromFhir, Practitioner),
}
