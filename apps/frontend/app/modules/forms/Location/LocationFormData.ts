import { Schema } from 'effect'

import {
  Location,
  LocationMode,
  LocationStatus,
} from '@assessmentis/clinical-domain'
import { Identifier } from '@assessmentis/clinical-domain/data-types'
import type { Resource } from '@assessmentis/effectful-store'

const fields = {
  name: Schema.String,
  description: Schema.optional(Schema.String),
  status: Schema.optional(LocationStatus),
  mode: Schema.optional(LocationMode),
  identifierSystem: Schema.optional(Schema.String),
  identifierValue: Schema.optional(Schema.String),
} as const satisfies Schema.Struct.Fields

export class LocationFormData extends Schema.Class<LocationFormData>(
  'LocationFormData'
)(fields) {
  static readonly defaultFormValues: typeof LocationFormData.Encoded = {
    name: '',
    description: undefined,
    status: undefined,
    mode: undefined,
    identifierSystem: undefined,
    identifierValue: undefined,
  }

  static fromResource(location: Location): typeof LocationFormData.Encoded {
    return {
      name: location.name ?? '',
      description: location.description ?? undefined,
      status: location.status ?? undefined,
      mode: location.mode ?? undefined,
      identifierSystem: location.identifier?.[0]?.system ?? undefined,
      identifierValue: location.identifier?.[0]?.value ?? undefined,
    }
  }

  private toResource(): Location {
    const name = this.name.trim()
    const description = this.description?.trim()

    const system = this.identifierSystem?.trim()
    const value = this.identifierValue?.trim()

    return Location.make({
      name: name.length ? name : undefined,
      description: description?.length ? description : undefined,
      status: this.status,
      mode: this.mode,
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

  toCreatePayload(): Location {
    return this.toResource()
  }

  toUpdatePayload(base: Location): Resource.WithResourceUrl<Location> {
    if (!base.url) throw new Error('Cannot update resource without url')
    return { ...base, ...this.toResource(), url: base.url }
  }
}
