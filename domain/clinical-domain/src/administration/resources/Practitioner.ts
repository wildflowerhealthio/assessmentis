import { Schema } from 'effect'
import type fhir from 'fhir/r4'
import type { DomainResource } from '../../data-types/base/DomainResource'
import { DomainResourceFromFhirR4 } from '../../data-types/base/DomainResource'
import type { BackboneElement } from '../../data-types/base/BackboneElement'
import { BackboneElementFromFhirR4 } from '../../data-types/base/BackboneElement'
import type {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import {
  IdentifierFromFhirR4,
  ReferenceFromFhirR4,
} from '../../data-types/complex/IdentifierAndReference'
import { HumanName } from '../../data-types/complex/HumanName'
import type { ContactPoint } from '../../data-types/complex/ContactPoint'
import { ContactPointFromFhirR4 } from '../../data-types/complex/ContactPoint'
import {
  AddressFromFhirR4,
  type Address,
} from '../../data-types/complex/Address'
import type { Attachment } from '../../data-types/complex/Attachment'
import { AttachmentFromFhirR4 } from '../../data-types/complex/Attachment'
import type { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { CodeableConceptFromFhirR4 } from '../../data-types/complex/CodeableConcept'
import type { Period } from '../../data-types/complex/Period'
import { PeriodFromFhirR4 } from '../../data-types/complex/Period'
import { AdministrativeGender } from '../value-sets/AdministrativeGender'
import { TimelessDateFromString } from '@assessmentis/util'

export const PractitionerId = Schema.String.pipe(Schema.brand('PractitionerId'))

export type PractitionerId = typeof PractitionerId.Type

// --- Sub-component ---

const PractitionerQualificationId = Schema.String.pipe(
  Schema.brand('PractitionerQualificationId')
)
type PractitionerQualificationId = typeof PractitionerQualificationId.Type

interface PractitionerQualification extends BackboneElement<PractitionerQualificationId> {
  identifier?: Identifier[]
  code: CodeableConcept
  period?: Period
  issuer?: Reference
}

const PractitionerQualificationFromFhirR4: Schema.Schema<
  PractitionerQualification,
  fhir.PractitionerQualification,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(PractitionerQualificationId),
  Schema.Struct({
    identifier: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => IdentifierFromFhirR4)))
    ),
    code: Schema.suspend(() => CodeableConceptFromFhirR4),
    period: Schema.optional(Schema.suspend(() => PeriodFromFhirR4)),
    issuer: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
  })
)

// --- Practitioner ---

/**
 * A person who is directly or indirectly involved in the provisioning of healthcare.
 */
export interface Practitioner extends DomainResource<PractitionerId> {
  resourceType: 'Practitioner'
  identifier?: Identifier[]
  active?: boolean
  name?: HumanName[]
  telecom?: ContactPoint[]
  address?: Address[]
  gender?: AdministrativeGender
  birthDate?: Date
  photo?: Attachment[]
  qualification?: PractitionerQualification[]
  communication?: CodeableConcept[]
}

/**
 * Schema for transforming between Practitioner Data objects and FHIR R4 Practitioner resources.
 */
export const PractitionerFromFhirR4: Schema.Schema<
  Practitioner,
  fhir.Practitioner,
  never
> = Schema.extend(
  DomainResourceFromFhirR4(PractitionerId),
  Schema.Struct({
    resourceType: Schema.Literal('Practitioner'),
    identifier: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => IdentifierFromFhirR4)))
    ),
    active: Schema.optional(Schema.Boolean),
    name: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => HumanName)))
    ),
    telecom: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => ContactPointFromFhirR4)))
    ),
    address: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => AddressFromFhirR4)))
    ),
    gender: Schema.optional(AdministrativeGender),
    birthDate: Schema.optional(TimelessDateFromString),
    photo: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => AttachmentFromFhirR4)))
    ),
    qualification: Schema.optional(
      Schema.mutable(Schema.Array(PractitionerQualificationFromFhirR4))
    ),
    communication: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
      )
    ),
  })
)
