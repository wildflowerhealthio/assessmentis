import { Schema } from 'effect'
import { DomainResource } from '../../data-types/base/DomainResource'
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
import { AdministrativeGender } from '../value-sets/AdministrativeGender'
import { TimelessDateFromString } from '@assessmentis/util'

export const PractitionerId = Schema.String.pipe(Schema.brand('PractitionerId'))

export type PractitionerId = typeof PractitionerId.Type

/**
 * A person who is directly or indirectly involved in the provisioning of healthcare.
 */
export const Practitioner = Schema.Struct({
  ...DomainResource(PractitionerId).fields,
  resourceType: Schema.Literal('Practitioner'),
  /**
   * An identifier that applies to this person in this role.
   */
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
  /**
   * Whether this practitioner's record is in active use.
   */
  active: Schema.optional(Schema.Boolean),
  /**
   * The name(s) associated with the practitioner.
   */
  name: Schema.optional(Schema.Array(HumanName)),
  /**
   * A contact detail for the practitioner, e.g. a telephone number or an email address.
   */
  telecom: Schema.optional(Schema.Array(ContactPoint)),
  /**
   * Address(es) of the practitioner that are not role specific (typically home address). Work addresses are not typically entered in this property as they are usually role dependent.
   */
  address: Schema.optional(Schema.Array(Address)),
  /**
   * Administrative Gender - the gender that the person is considered to have for administration and record keeping purposes.
   */
  gender: Schema.optional(AdministrativeGender),
  /**
   * The date of birth for the practitioner.
   */
  birthDate: Schema.optional(TimelessDateFromString),
  /**
   * Image of the person.
   */
  photo: Schema.optional(Schema.Array(Attachment)),
  /**
   * The official certifications, training, and licenses that authorize or otherwise pertain to the provision of care by the practitioner. For example, a medical license issued by a medical board authorizing the practitioner to practice medicine within a certain locality.
   */
  qualification: Schema.optional(
    Schema.Array(
      Schema.Struct({
        /**
         * An identifier that applies to this person's qualification in this role.
         */
        identifier: Schema.optional(
          Schema.Array(Schema.suspend(() => Identifier))
        ),
        /**
         * Coded representation of the qualification.
         */
        code: CodeableConcept,
        /**
         * Period during which the qualification is valid.
         */
        period: Schema.optional(Period),
        /**
         * Organization that regulates and issues the qualification.
         */
        issuer: Schema.optional(Schema.suspend(() => Reference)),
      })
    )
  ),
  /**
   * A language the practitioner can use in patient communication.
   */
  communication: Schema.optional(Schema.Array(CodeableConcept)),
})

export type Practitioner = typeof Practitioner.Type
