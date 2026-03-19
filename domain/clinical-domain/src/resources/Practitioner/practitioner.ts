import { Schema } from 'effect'

import {
  AnnotateArrayWithArbitrary,
  TimelessDateFromString,
  makeCloneWith,
} from '@assessmentis/util'

import { Resource } from '../../data-types/base/resource'
import type { ResourceEncoded } from '../../data-types/base/resource'
import { Address } from '../../data-types/complex/address'
import { AdministrativeGender } from '../../data-types/complex/administrative-gender'
import { Attachment } from '../../data-types/complex/attachment'
import { CodeableConcept } from '../../data-types/complex/codeable-concept'
import { ContactPoint } from '../../data-types/complex/contact-point'
import { HumanName } from '../../data-types/complex/human-name'
import { Identifier } from '../../data-types/complex/identifier-and-reference'
import { PractitionerQualification } from './practitioner-qualification'

const DomainType = 'Practitioner' as const
type DomainType = typeof DomainType

// --- Practitioner ---

const fields = {
  active: Schema.optional(Schema.Boolean),
  address: Schema.optional(
    Schema.Array(Schema.suspend(() => Address)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  birthDate: Schema.optional(TimelessDateFromString),
  communication: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  gender: Schema.optional(AdministrativeGender),
  identifier: Schema.optional(
    Schema.Array(Schema.suspend(() => Identifier)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  name: Schema.optional(
    Schema.Array(Schema.suspend(() => HumanName)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  photo: Schema.optional(
    Schema.Array(Schema.suspend(() => Attachment)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  qualification: Schema.optional(
    Schema.Array(PractitionerQualification).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  telecom: Schema.optional(
    Schema.Array(Schema.suspend(() => ContactPoint)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
} as const satisfies Schema.Struct.Fields

const PractitionerResource = Resource(DomainType)

/** Encoded (wire-format) shape of a {@link Practitioner}. */
export interface PractitionerEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {}

/**
 * A person who is directly or indirectly involved in the provisioning of healthcare.
 */
export class Practitioner extends PractitionerResource.extend<Practitioner>(DomainType)(fields) {
  static DomainType = PractitionerResource.DomainType
  static UrlSchema = PractitionerResource.UrlSchema
  readonly cloneWith = makeCloneWith(Practitioner, this)
}
