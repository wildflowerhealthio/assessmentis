import { Schema } from 'effect'

import { Practitioner } from '@assessmentis/clinical-domain'
import type { PractitionerEncoded } from '@assessmentis/clinical-domain'
import { AdministrativeGender } from '@assessmentis/clinical-domain/data-types'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/resource'
import { FhirR4Address } from '../../data-types/complex/address'
import { FhirR4Attachment } from '../../data-types/complex/attachment'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import { FhirR4ContactPoint } from '../../data-types/complex/contact-point'
import { FhirR4HumanName } from '../../data-types/complex/human-name'
import { FhirR4Identifier } from '../../data-types/complex/identifier-and-reference'
import type { BaseUrl } from '../../data-types/url-identification'
import { PractitionerQualificationEncodedFromFhir } from './practitioner-qualification'

const EncodedFromFhir: Schema.Schema<PractitionerEncoded, FhirR4.Practitioner, BaseUrl> =
  Schema.extend(
    ResourceEncodedFromFhirR4Resource('Practitioner', 'Practitioner'),
    mutableEncoded(
      Schema.Struct({
        active: Schema.optional(Schema.Boolean),
        address: Schema.optional(
          mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Address.EncodedFromExternal)))
        ),
        birthDate: Schema.optional(Schema.String),
        communication: Schema.optional(
          mutableEncoded(
            Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
          )
        ),
        gender: Schema.optional(AdministrativeGender),
        identifier: Schema.optional(
          mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)))
        ),
        name: Schema.optional(
          mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4HumanName.EncodedFromExternal)))
        ),
        photo: Schema.optional(
          mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Attachment.EncodedFromExternal)))
        ),
        qualification: Schema.optional(
          mutableEncoded(Schema.Array(PractitionerQualificationEncodedFromFhir))
        ),
        telecom: Schema.optional(
          mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4ContactPoint.EncodedFromExternal)))
        ),
      })
    )
  )

export const FhirR4Practitioner = new TwoStepExternalSchema<
  Practitioner,
  PractitionerEncoded,
  FhirR4.Practitioner,
  BaseUrl
>(Practitioner, EncodedFromFhir)
