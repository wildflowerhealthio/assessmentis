import { Schema } from 'effect'
import { LocationStatus, LocationMode } from '@assessmentis/clinical-domain'
import type { Location } from '@assessmentis/clinical-domain'

export const LocationFormSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  status: Schema.optional(LocationStatus),
  mode: Schema.optional(LocationMode),
  identifierSystem: Schema.optional(Schema.String),
  identifierValue: Schema.optional(Schema.String),
})

export type LocationFormData = typeof LocationFormSchema.Type

export function transformToLocation(
  formData: LocationFormData
): Omit<Location, 'id'> {
  const name = formData.name.trim()
  const description = formData.description?.trim()

  const system = formData.identifierSystem?.trim()
  const value = formData.identifierValue?.trim()

  return {
    resourceType: 'Location',
    name: name.length ? name : undefined,
    description: description?.length ? description : undefined,
    status: formData.status,
    mode: formData.mode,
    identifier:
      system?.length || value?.length
        ? [
            {
              system: system?.length ? system : undefined,
              value: value?.length ? value : undefined,
            },
          ]
        : undefined,
  }
}
