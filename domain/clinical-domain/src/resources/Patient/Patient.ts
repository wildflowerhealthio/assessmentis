import { Schema } from 'effect'

import { MergeClasses, TimelessDateFromString } from '@assessmentis/util'

import { Resource, type ResourceEncoded } from '../../data-types/base/Resource'
import { Address } from '../../data-types/complex/Address'
import { AdministrativeGender } from '../../data-types/complex/AdministrativeGender'
import { Attachment } from '../../data-types/complex/Attachment'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { ContactPoint } from '../../data-types/complex/ContactPoint'
import { HumanName } from '../../data-types/complex/HumanName'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { PatientCommunication } from './PatientCommunication'
import { PatientContact } from './PatientContact'
import { PatientLink } from './PatientLink'

const DomainType = 'Patient' as const
type DomainType = typeof DomainType

// --- Patient ---

const fields = {
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
  contact: Schema.optional(Schema.Array(PatientContact)),
  communication: Schema.optional(Schema.Array(PatientCommunication)),
  generalPractitioner: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference))
  ),
  managingOrganization: Schema.optional(Schema.suspend(() => Reference)),
  link: Schema.optional(Schema.Array(PatientLink)),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(DomainType)

/** Encoded (wire-format) shape of a {@link Patient}. */
export interface PatientEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {}

/**
 * Demographics and other administrative information about an individual or animal
 * receiving care or other health-related services.
 */
export class Patient extends MergeClasses<Patient>(DomainType)(
  [],
  resourceMixin,
  fields
) {}
