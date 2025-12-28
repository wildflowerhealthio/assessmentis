import { Schema } from 'effect'
import {
  Patient,
  AdministrativeGender,
} from '@assessmentis/clinical-domain/administration'

export const PatientFormSchema = Schema.Struct({
  givenName: Schema.String,
  familyName: Schema.String,
  gender: Schema.optional(AdministrativeGender),
  birthDate: Schema.optional(Schema.String),
  practitionerId: Schema.optional(Schema.String),
})

export type PatientFormData = typeof PatientFormSchema.Type

export function transformToPatient(
  formData: PatientFormData
): Omit<Patient, 'id'> {
  return {
    resourceType: 'Patient' as const,
    name:
      formData.givenName || formData.familyName
        ? [
            {
              given: formData.givenName ? [formData.givenName] : undefined,
              family: formData.familyName,
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
