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
  return {
    resourceType: 'Practitioner' as const,
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
    qualification: formData.qualification
      ? [
          {
            code: {
              text: formData.qualification,
            },
          },
        ]
      : undefined,
    active: true,
  }
}
