import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {} from '../../FhirR4ResourceBehaviour'
import type {
  Practitioner,
  PractitionerQualification,
} from '@assessmentis/clinical-domain/administration'
import {
  PractitionerId,
  AdministrativeGender,
} from '@assessmentis/clinical-domain/administration'
import { TimelessDateFromString } from '@assessmentis/util'
import { FhirR4DomainResource } from '../../data-types/base/DomainResource'
import { FhirR4BackboneElement } from '../../data-types/base/BackboneElement'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { FhirR4HumanName } from '../../data-types/complex/HumanName'
import { FhirR4ContactPoint } from '../../data-types/complex/ContactPoint'
import { FhirR4Address } from '../../data-types/complex/Address'
import { FhirR4Attachment } from '../../data-types/complex/Attachment'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { FhirR4Period } from '../../data-types/complex/Period'

// --- Sub-component ---

const PractitionerQualificationId = Schema.String.pipe(
  Schema.brand('PractitionerQualificationId')
)

const FhirR4PractitionerQualificationSchema: Schema.Schema<
  PractitionerQualification,
  FhirR4.PractitionerQualification,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(PractitionerQualificationId),
  Schema.Struct({
    identifier: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4Identifier.Schema))
      )
    ),
    code: Schema.suspend(() => FhirR4CodeableConcept.Schema),
    period: Schema.optional(Schema.suspend(() => FhirR4Period.Schema)),
    issuer: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
  })
)

// --- Practitioner ---

const FhirR4PractitionerSchema: Schema.Schema<
  Practitioner,
  FhirR4.Practitioner,
  never
> = Schema.extend(
  FhirR4DomainResource.Schema(PractitionerId),
  Schema.Struct({
    resourceType: Schema.Literal('Practitioner'),
    identifier: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4Identifier.Schema))
      )
    ),
    active: Schema.optional(Schema.Boolean),
    name: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => FhirR4HumanName.Schema)))
    ),
    telecom: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4ContactPoint.Schema))
      )
    ),
    address: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => FhirR4Address.Schema)))
    ),
    gender: Schema.optional(AdministrativeGender),
    birthDate: Schema.optional(TimelessDateFromString),
    photo: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4Attachment.Schema))
      )
    ),
    qualification: Schema.optional(
      Schema.mutable(Schema.Array(FhirR4PractitionerQualificationSchema))
    ),
    communication: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
      )
    ),
  })
)

export const FhirR4Practitioner = {
  resourceType: 'Practitioner',
  Schema: FhirR4PractitionerSchema,
}
