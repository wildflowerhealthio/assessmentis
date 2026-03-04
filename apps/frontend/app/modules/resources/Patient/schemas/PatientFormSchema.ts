import { Schema } from 'effect'
import { Patient, Practitioner } from '@assessmentis/clinical-domain'
import {
  AdministrativeGender,
  HumanName,
  Reference,
} from '@assessmentis/clinical-domain/data-types'

export const PatientFormSchema = Schema.Struct({
  givenName: Schema.String,
  familyName: Schema.String,
  gender: Schema.optional(AdministrativeGender),
  birthDate: Schema.optional(Schema.DateFromSelf),
  practitionerUrl: Schema.optional(Practitioner.UrlSchema),
})

export type PatientFormData = typeof PatientFormSchema.Type

export function transformToPatient(formData: PatientFormData): Patient {
  const givenName = formData.givenName?.trim()
  const familyName = formData.familyName?.trim()

  return Patient.make({
    name:
      givenName || familyName
        ? [
            HumanName.make({
              given: givenName ? [givenName] : undefined,
              family: familyName || undefined,
            }),
          ]
        : undefined,
    gender: formData.gender,
    birthDate: formData.birthDate ? formData.birthDate : undefined,
    generalPractitioner: formData.practitionerUrl
      ? [
          Reference.make({
            reference: formData.practitionerUrl.toString(),
          }),
        ]
      : undefined,
    active: true,
  })
}
