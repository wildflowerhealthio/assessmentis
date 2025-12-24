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

export const PatientId = Schema.String.pipe(Schema.brand('PatientId'))

export type PatientId = typeof PatientId.Type

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

/**
 * Demographics and other administrative information about an individual or animal receiving care or other health-related services.
 */
export const Patient = Schema.Struct({
  ...DomainResource(PatientId).fields,
  resourceType: Schema.Literal('Patient'),
  /**
   * An identifier for this patient.
   */
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
  /**
   * Whether this patient record is in active use.
   * Many systems use this property to mark as non-current patients, such as those that have not been seen for a period of time based on an organization's business rules.
   */
  active: Schema.optional(Schema.Boolean),
  /**
   * A name associated with the individual.
   */
  name: Schema.optional(Schema.Array(HumanName)),
  /**
   * A contact detail (e.g. a telephone number or an email address) by which the individual may be contacted.
   */
  telecom: Schema.optional(Schema.Array(ContactPoint)),
  /**
   * Administrative Gender - the gender that the patient is considered to have for administration and record keeping purposes.
   */
  gender: Schema.optional(AdministrativeGender),
  /**
   * The date of birth for the individual.
   */
  birthDate: Schema.optional(Schema.String),
  /**
   * Indicates if the individual is deceased or not.
   */
  deceasedBoolean: Schema.optional(Schema.Boolean),
  /**
   * The date and time of death if the patient is deceased.
   */
  deceasedDateTime: Schema.optional(Schema.DateTimeUtc),
  /**
   * An address for the individual.
   */
  address: Schema.optional(Schema.Array(Address)),
  /**
   * This field contains a patient's most recent marital (civil) status.
   */
  maritalStatus: Schema.optional(CodeableConcept),
  /**
   * Indicates whether the patient is part of a multiple (boolean) or indicates the actual birth order (integer).
   */
  multipleBirthBoolean: Schema.optional(Schema.Boolean),
  /**
   * The birth order in a multiple birth scenario (e.g., twin #1, twin #2).
   */
  multipleBirthInteger: Schema.optional(Schema.Number),
  /**
   * Image of the patient.
   */
  photo: Schema.optional(Schema.Array(Attachment)),
  /**
   * A contact party (e.g. guardian, partner, friend) for the patient.
   */
  contact: Schema.optional(
    Schema.Array(
      Schema.Struct({
        /**
         * The nature of the relationship between the patient and the contact person.
         */
        relationship: Schema.optional(Schema.Array(CodeableConcept)),
        /**
         * A name associated with the contact person.
         */
        name: Schema.optional(HumanName),
        /**
         * A contact detail for the person, e.g. a telephone number or an email address.
         */
        telecom: Schema.optional(Schema.Array(ContactPoint)),
        /**
         * Address for the contact person.
         */
        address: Schema.optional(Address),
        /**
         * Administrative Gender - the gender that the contact person is considered to have for administration and record keeping purposes.
         */
        gender: Schema.optional(AdministrativeGender),
        /**
         * Organization on behalf of which the contact is acting or for which the contact is working.
         */
        organization: Schema.optional(Schema.suspend(() => Reference)),
        /**
         * The period during which this contact person or organization is valid to be contacted relating to this patient.
         */
        period: Schema.optional(Period),
      })
    )
  ),
  /**
   * A language which may be used to communicate with the patient about his or her health.
   */
  communication: Schema.optional(
    Schema.Array(
      Schema.Struct({
        /**
         * The ISO-639-1 alpha 2 code in lower case for the language, optionally followed by a hyphen and the ISO-3166-1 alpha 2 code for the region in upper case; e.g. "en" for English, or "en-US" for American English versus "en-EN" for England English.
         */
        language: CodeableConcept,
        /**
         * Indicates whether or not the patient prefers this language (over other languages he masters up a certain level).
         */
        preferred: Schema.optional(Schema.Boolean),
      })
    )
  ),
  /**
   * Patient's nominated care provider.
   */
  generalPractitioner: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference))
  ),
  /**
   * Organization that is the custodian of the patient record.
   */
  managingOrganization: Schema.optional(Schema.suspend(() => Reference)),
  /**
   * Link to another patient resource that concerns the same actual patient.
   */
  link: Schema.optional(
    Schema.Array(
      Schema.Struct({
        /**
         * The other patient resource that the link refers to.
         */
        other: Schema.suspend(() => Reference),
        /**
         * The type of link between this patient resource and another patient resource.
         */
        type: PatientLinkType,
      })
    )
  ),
})

export type Patient = typeof Patient.Type
