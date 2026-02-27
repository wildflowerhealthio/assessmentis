import { Schema } from 'effect'
import { Patient } from '@assessmentis/clinical-domain'
import {
  AdministrativeGender,
  IdentifierAndReference,
} from '@assessmentis/clinical-domain/data-types'

export const PatientFormSchema = Schema.Struct({
  givenName: Schema.String,
  familyName: Schema.String,
  gender: Schema.optional(AdministrativeGender.AdministrativeGender),
  birthDate: Schema.optional(Schema.DateFromSelf),
  practitionerId: Schema.optional(Schema.String),
})

export type PatientFormData = typeof PatientFormSchema.Type

export function transformToPatient(
  formData: PatientFormData
): Patient {
  const givenName = formData.givenName?.trim()
  const familyName = formData.familyName?.trim()

  return Patient.make({
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
    birthDate: formData.birthDate,
    generalPractitioner: formData.practitionerId
      ? [IdentifierAndReference.Reference.make({ reference: `Practitioner/${formData.practitionerId}` })]
      : undefined,
    active: true,
  })
}
