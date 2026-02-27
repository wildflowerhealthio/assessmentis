import { Schema } from 'effect'
import { MergeClasses } from '@assessmentis/util'
import { Resource, type ResourceEncoded } from '../../data-types/base/Resource'
import { Identifier } from '../../data-types/complex/IdentifierAndReference'
import { HumanName } from '../../data-types/complex/HumanName'
import { ContactPoint } from '../../data-types/complex/ContactPoint'
import { Address } from '../../data-types/complex/Address'
import { Attachment } from '../../data-types/complex/Attachment'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { AdministrativeGender } from '../../data-types/complex/AdministrativeGender'
import { TimelessDateFromString } from '@assessmentis/util'
import { PractitionerQualification } from './PractitionerQualification'

const Key = 'Practitioner' as const
type Key = typeof Key

// --- Practitioner ---

const fields = {
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
  active: Schema.optional(Schema.Boolean),
  name: Schema.optional(Schema.Array(Schema.suspend(() => HumanName))),
  telecom: Schema.optional(Schema.Array(Schema.suspend(() => ContactPoint))),
  address: Schema.optional(Schema.Array(Schema.suspend(() => Address))),
  gender: Schema.optional(AdministrativeGender),
  birthDate: Schema.optional(TimelessDateFromString),
  photo: Schema.optional(Schema.Array(Schema.suspend(() => Attachment))),
  qualification: Schema.optional(Schema.Array(PractitionerQualification)),
  communication: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(Key)

export interface PractitionerEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<Key> {}

/**
 * A person who is directly or indirectly involved in the provisioning of healthcare.
 */
export class Practitioner extends MergeClasses<Practitioner>(Key)(
  [],
  resourceMixin,
  fields
) {}
