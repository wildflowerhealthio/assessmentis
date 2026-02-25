import { Schema } from 'effect'
import { applySchemaMixinTo } from '@assessmentis/util'
import { BackboneElement } from '../../data-types/base/BackboneElement'
import { Resource, type ResourceEncoded } from '../../data-types/base/Resource'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { HumanName } from '../../data-types/complex/HumanName'
import { ContactPoint } from '../../data-types/complex/ContactPoint'
import { Address } from '../../data-types/complex/Address'
import { Attachment } from '../../data-types/complex/Attachment'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Period } from '../../data-types/complex/Period'
import { AdministrativeGender } from '../../data-types/complex/AdministrativeGender'
import { TimelessDateFromString } from '@assessmentis/util'

const Key = 'Patient' as const
type Key = typeof Key

/**
 * This element is labeled as a modifier because it may be used to mark that the
 * resource was created in error.
 */
export const PatientLinkType = Schema.Enums({
  'replaced-by': 'replaced-by',
  replaces: 'replaces',
  refer: 'refer',
  seealso: 'seealso',
} as const)

export type PatientLinkType = typeof PatientLinkType.Type

// --- Sub-component schemas ---

const PatientContactSchema = Schema.Struct({
  ...BackboneElement('PatientContact').fields,
  relationship: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  name: Schema.optional(Schema.suspend(() => HumanName)),
  telecom: Schema.optional(Schema.Array(Schema.suspend(() => ContactPoint))),
  address: Schema.optional(Schema.suspend(() => Address)),
  gender: Schema.optional(AdministrativeGender),
  organization: Schema.optional(Schema.suspend(() => Reference)),
  period: Schema.optional(Schema.suspend(() => Period)),
})

const PatientCommunicationSchema = Schema.Struct({
  ...BackboneElement('PatientCommunication').fields,
  language: Schema.suspend(() => CodeableConcept),
  preferred: Schema.optional(Schema.Boolean),
})

const PatientLinkSchema = Schema.Struct({
  ...BackboneElement('PatientLink').fields,
  other: Schema.suspend(() => Reference),
  type: PatientLinkType,
})

// --- Patient ---

const fields = {
  resourceType: Schema.Literal('Patient'),
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
  active: Schema.optional(Schema.Boolean),
  name: Schema.optional(Schema.Array(Schema.suspend(() => HumanName))),
  telecom: Schema.optional(Schema.Array(Schema.suspend(() => ContactPoint))),
  gender: Schema.optional(AdministrativeGender),
  birthDate: Schema.optional(TimelessDateFromString),
  deceasedBoolean: Schema.optional(Schema.Boolean),
  deceasedDateTime: Schema.optional(Schema.DateTimeUtc),
  address: Schema.optional(Schema.Array(Schema.suspend(() => Address))),
  maritalStatus: Schema.optional(Schema.suspend(() => CodeableConcept)),
  multipleBirthBoolean: Schema.optional(Schema.Boolean),
  multipleBirthInteger: Schema.optional(Schema.Number),
  photo: Schema.optional(Schema.Array(Schema.suspend(() => Attachment))),
  contact: Schema.optional(Schema.Array(PatientContactSchema)),
  communication: Schema.optional(Schema.Array(PatientCommunicationSchema)),
  generalPractitioner: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference))
  ),
  managingOrganization: Schema.optional(Schema.suspend(() => Reference)),
  link: Schema.optional(Schema.Array(PatientLinkSchema)),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(Key)

export interface PatientEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<Key> {}

/**
 * Demographics and other administrative information about an individual or animal
 * receiving care or other health-related services.
 */
class Patient extends Schema.Class<Patient>(Key)({
  ...resourceMixin.fields,
  ...fields,
}) {}

const PatientWithMixin = applySchemaMixinTo(Patient, resourceMixin)
type PatientWithMixin = Patient

export { PatientWithMixin as Patient }
