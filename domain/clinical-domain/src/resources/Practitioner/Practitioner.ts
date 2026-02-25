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

const Key = 'Practitioner' as const
type Key = typeof Key

// --- Sub-component ---

const PractitionerQualificationSchema = Schema.Struct({
  ...BackboneElement('PractitionerQualification').fields,
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
  code: Schema.suspend(() => CodeableConcept),
  period: Schema.optional(Schema.suspend(() => Period)),
  issuer: Schema.optional(Schema.suspend(() => Reference)),
})

// --- Practitioner ---

const fields = {
  resourceType: Schema.Literal('Practitioner'),
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
  active: Schema.optional(Schema.Boolean),
  name: Schema.optional(Schema.Array(Schema.suspend(() => HumanName))),
  telecom: Schema.optional(Schema.Array(Schema.suspend(() => ContactPoint))),
  address: Schema.optional(Schema.Array(Schema.suspend(() => Address))),
  gender: Schema.optional(AdministrativeGender),
  birthDate: Schema.optional(TimelessDateFromString),
  photo: Schema.optional(Schema.Array(Schema.suspend(() => Attachment))),
  qualification: Schema.optional(Schema.Array(PractitionerQualificationSchema)),
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
class Practitioner extends Schema.Class<Practitioner>(Key)({
  ...resourceMixin.fields,
  ...fields,
}) {}

const PractitionerWithMixin = applySchemaMixinTo(Practitioner, resourceMixin)
type PractitionerWithMixin = Practitioner

export { PractitionerWithMixin as Practitioner }
