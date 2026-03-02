import { Schema } from 'effect'
import { Practitioner, PractitionerQualification } from '@assessmentis/clinical-domain'
import {
  AdministrativeGender,
  CodeableConcept,
} from '@assessmentis/clinical-domain/data-types'

export const PractitionerFormSchema = Schema.Struct({
  givenName: Schema.String,
  familyName: Schema.String,
  gender: Schema.optional(AdministrativeGender.AdministrativeGender),
  qualification: Schema.optional(Schema.String),
})

export type PractitionerFormData = typeof PractitionerFormSchema.Type

export function transformToPractitioner(
  formData: PractitionerFormData
): Practitioner {
  const givenName = formData.givenName?.trim()
  const familyName = formData.familyName?.trim()
  const qualification = formData.qualification?.trim()

  return Practitioner.make({
    name:
      givenName || familyName
        ? [
            {
              given: givenName ? [givenName] : undefined,
              family: familyName || undefined,
            },
          ]
        : undefined,
    gender: formData.gender,
    qualification: qualification
      ? [
          PractitionerQualification.make({
            code: CodeableConcept.make({
              text: qualification,
              coding: [],
            }),
          }),
        ]
      : undefined,
    active: true,
  })
}
