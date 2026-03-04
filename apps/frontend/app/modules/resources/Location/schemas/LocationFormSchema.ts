import { Schema } from 'effect'
import { Location, LocationStatus, LocationMode } from '@assessmentis/clinical-domain'
import { Identifier } from '@assessmentis/clinical-domain/data-types'

export const LocationFormSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  status: Schema.optional(LocationStatus),
  mode: Schema.optional(LocationMode),
  identifierSystem: Schema.optional(Schema.String),
  identifierValue: Schema.optional(Schema.String),
})

export type LocationFormData = typeof LocationFormSchema.Type

export function transformToLocation(formData: LocationFormData): Location {
  const name = formData.name.trim()
  const description = formData.description?.trim()

  const system = formData.identifierSystem?.trim()
  const value = formData.identifierValue?.trim()

  return Location.make({
    name: name.length ? name : undefined,
    description: description?.length ? description : undefined,
    status: formData.status,
    mode: formData.mode,
    identifier:
      system?.length || value?.length
        ? [
            Identifier.make({
              system: system?.length ? system : undefined,
              value: value?.length ? value : undefined,
            }),
          ]
        : undefined,
  })
}
