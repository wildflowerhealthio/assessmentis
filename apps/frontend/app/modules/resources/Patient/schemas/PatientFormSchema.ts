import { Schema } from 'effect'
import {
  Patient,
  AdministrativeGender,
} from '@assessmentis/clinical-domain/administration'

export const PatientFormSchema = Schema.Struct({
  givenName: Schema.String,
  familyName: Schema.String,
  gender: Schema.optional(AdministrativeGender),
  birthDate: Schema.optional(Schema.DateFromSelf),
  practitionerId: Schema.optional(Schema.String),
})

export type PatientFormData = typeof PatientFormSchema.Type

export function transformToPatient(
  formData: PatientFormData
): Omit<Patient, 'id'> {
  const givenName = formData.givenName?.trim()
  const familyName = formData.familyName?.trim()

  return {
    resourceType: 'Patient' as const,
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
      ? [{ reference: `Practitioner/${formData.practitionerId}` }]
      : undefined,
    active: true,
  }
}
