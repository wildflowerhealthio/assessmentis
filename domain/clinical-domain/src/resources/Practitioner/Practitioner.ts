import { Schema } from 'effect'

import {
  AnnotateArrayWithArbitrary,
  MergeClasses,
  TimelessDateFromString,
} from '@assessmentis/util'

import { Resource } from '../../data-types/base/Resource'
import type { ResourceEncoded } from '../../data-types/base/Resource'
import { Address } from '../../data-types/complex/Address'
import { AdministrativeGender } from '../../data-types/complex/AdministrativeGender'
import { Attachment } from '../../data-types/complex/Attachment'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { ContactPoint } from '../../data-types/complex/ContactPoint'
import { HumanName } from '../../data-types/complex/HumanName'
import { Identifier } from '../../data-types/complex/IdentifierAndReference'
import { PractitionerQualification } from './PractitionerQualification'

const DomainType = 'Practitioner' as const
type DomainType = typeof DomainType

// --- Practitioner ---

const fields = {
  identifier: Schema.optional(
    Schema.Array(Schema.suspend(() => Identifier)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  active: Schema.optional(Schema.Boolean),
  name: Schema.optional(
    Schema.Array(Schema.suspend(() => HumanName)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  telecom: Schema.optional(
    Schema.Array(Schema.suspend(() => ContactPoint)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  address: Schema.optional(
    Schema.Array(Schema.suspend(() => Address)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  gender: Schema.optional(AdministrativeGender),
  birthDate: Schema.optional(TimelessDateFromString),
  photo: Schema.optional(
    Schema.Array(Schema.suspend(() => Attachment)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  qualification: Schema.optional(
    Schema.Array(PractitionerQualification).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  communication: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(DomainType)

/** Encoded (wire-format) shape of a {@link Practitioner}. */
export interface PractitionerEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {}

/**
 * A person who is directly or indirectly involved in the provisioning of healthcare.
 */
export class Practitioner extends MergeClasses<Practitioner>(DomainType)(
  [],
  resourceMixin,
  fields
) {}
