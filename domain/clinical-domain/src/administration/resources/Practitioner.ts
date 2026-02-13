import { Schema } from 'effect'
import type {
  Practitioner as FhirPractitioner,
  PractitionerQualification as FhirPractitionerQualification,
} from 'fhir/r4'
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
import { ContactPoint } from '../../data-types/complex/ContactPoint'
import { Address } from '../../data-types/complex/Address'
import type { Attachment } from '../../data-types/complex/Attachment'
import { AttachmentFromFhirR4 } from '../../data-types/complex/Attachment'
import type { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { CodeableConceptFromFhirR4 } from '../../data-types/complex/CodeableConcept'
import type { Period } from '../../data-types/complex/Period'
import { PeriodFromFhirR4 } from '../../data-types/complex/Period'
import { AdministrativeGender } from '../value-sets/AdministrativeGender'
import { TimelessDateFromString, type DeepReadonly } from '@assessmentis/util'

export const PractitionerId = Schema.String.pipe(Schema.brand('PractitionerId'))

export type PractitionerId = typeof PractitionerId.Type

// --- Sub-component ---

const PractitionerQualificationId = Schema.String.pipe(
  Schema.brand('PractitionerQualificationId')
)
type PractitionerQualificationId = typeof PractitionerQualificationId.Type

interface PractitionerQualification extends BackboneElement<PractitionerQualificationId> {
  identifier?: ReadonlyArray<Identifier>
  code: CodeableConcept
  period?: Period
  issuer?: Reference
}

const PractitionerQualificationFromFhirR4: Schema.Schema<
  PractitionerQualification,
  DeepReadonly<FhirPractitionerQualification>,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(PractitionerQualificationId),
  Schema.Struct({
    identifier: Schema.optional(
      Schema.Array(Schema.suspend(() => IdentifierFromFhirR4))
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
  identifier?: ReadonlyArray<Identifier>
  active?: boolean
  name?: ReadonlyArray<HumanName>
  telecom?: ReadonlyArray<ContactPoint>
  address?: ReadonlyArray<Address>
  gender?: AdministrativeGender
  birthDate?: Date
  photo?: ReadonlyArray<Attachment>
  qualification?: ReadonlyArray<PractitionerQualification>
  communication?: ReadonlyArray<CodeableConcept>
}

/**
 * Schema for transforming between Practitioner Data objects and FHIR R4 Practitioner resources.
 */
export const PractitionerFromFhirR4: Schema.Schema<
  Practitioner,
  DeepReadonly<FhirPractitioner>,
  never
> = Schema.extend(
  DomainResourceFromFhirR4(PractitionerId),
  Schema.Struct({
    resourceType: Schema.Literal('Practitioner'),
    identifier: Schema.optional(
      Schema.Array(Schema.suspend(() => IdentifierFromFhirR4))
    ),
    active: Schema.optional(Schema.Boolean),
    name: Schema.optional(Schema.Array(Schema.suspend(() => HumanName))),
    telecom: Schema.optional(Schema.Array(Schema.suspend(() => ContactPoint))),
    address: Schema.optional(Schema.Array(Schema.suspend(() => Address))),
    gender: Schema.optional(AdministrativeGender),
    birthDate: Schema.optional(TimelessDateFromString),
    photo: Schema.optional(
      Schema.Array(Schema.suspend(() => AttachmentFromFhirR4))
    ),
    qualification: Schema.optional(
      Schema.Array(PractitionerQualificationFromFhirR4)
    ),
    communication: Schema.optional(
      Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
    ),
  })
)
