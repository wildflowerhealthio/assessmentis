import { Schema } from 'effect'

import { Location, LocationMode, LocationStatus } from '@assessmentis/clinical-domain'
import { Identifier } from '@assessmentis/clinical-domain/data-types'
import type { Resource } from '@assessmentis/effectful-store'

const fields = {
  description: Schema.optional(Schema.String),
  identifierSystem: Schema.optional(Schema.String),
  identifierValue: Schema.optional(Schema.String),
  mode: Schema.optional(LocationMode),
  name: Schema.String,
  status: Schema.optional(LocationStatus),
} as const satisfies Schema.Struct.Fields

export class LocationFormData extends Schema.Class<LocationFormData>('LocationFormData')(fields) {
  static readonly defaultFormValues: typeof LocationFormData.Encoded = {
    description: undefined,
    identifierSystem: undefined,
    identifierValue: undefined,
    mode: undefined,
    name: '',
    status: undefined,
  }

  static fromResource(location: Location): typeof LocationFormData.Encoded {
    return {
      description: location.description ?? undefined,
      identifierSystem: location.identifier?.[0]?.system ?? undefined,
      identifierValue: location.identifier?.[0]?.value ?? undefined,
      mode: location.mode ?? undefined,
      name: location.name ?? '',
      status: location.status ?? undefined,
    }
  }

  private toConstructorArgs(): ConstructorParameters<typeof Location>[0] {
    const name = this.name.trim()
    const description = this.description?.trim()

    const system = this.identifierSystem?.trim()
    const value = this.identifierValue?.trim()

    let descriptionValue: string | undefined
    if (description?.length) {
      descriptionValue = description
    }
    let systemValue: string | undefined
    if (system?.length) {
      systemValue = system
    }
    let valueValue: string | undefined
    if (value?.length) {
      valueValue = value
    }

    let identifier: ReturnType<typeof Identifier.make>[] | undefined
    if (system?.length || value?.length) {
      identifier = [
        Identifier.make({
          system: systemValue,
          value: valueValue,
        }),
      ]
    }

    let nameValue: string | undefined
    if (name.length > 0) {
      nameValue = name
    }

    return {
      description: descriptionValue,
      identifier,
      mode: this.mode,
      name: nameValue,
      status: this.status,
    }
  }

  private toResource(): Location {
    return Location.make(this.toConstructorArgs())
  }

  toCreatePayload(): Location {
    return this.toResource()
  }

  toUpdatePayload(base: Resource.WithResourceUrl<Location>): Resource.WithResourceUrl<Location> {
    return base.cloneWith({ ...this.toConstructorArgs(), url: base.url })
  }
}
