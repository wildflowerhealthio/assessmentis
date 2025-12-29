import { Schema } from 'effect'
import {
  Practitioner,
  AdministrativeGender,
} from '@assessmentis/clinical-domain/administration'

export const PractitionerFormSchema = Schema.Struct({
  givenName: Schema.String,
  familyName: Schema.String,
  gender: Schema.optional(AdministrativeGender),
  qualification: Schema.optional(Schema.String),
})

export type PractitionerFormData = typeof PractitionerFormSchema.Type

export function transformToPractitioner(
  formData: PractitionerFormData
): Omit<Practitioner, 'id'> {
  const givenName = formData.givenName?.trim()
  const familyName = formData.familyName?.trim()
  const qualification = formData.qualification?.trim()

  return {
    resourceType: 'Practitioner' as const,
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
          {
            code: {
              text: qualification,
            },
          },
        ]
      : undefined,
    active: true,
  }
}
