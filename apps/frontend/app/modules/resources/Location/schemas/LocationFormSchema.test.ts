import { describe, it, expect } from 'vitest'
import { Schema } from 'effect'
import {
  type LocationFormData,
  LocationFormSchema,
  transformToLocation,
} from './LocationFormSchema'

describe('LocationFormSchema', () => {
  it('validates correct form data', () => {
    const valid: LocationFormData = {
      name: 'Clinic A',
      description: 'Main clinic entrance',
      status: 'active',
      mode: 'instance',
      identifierSystem: 'urn:example:location',
      identifierValue: 'clinic-a',
    }

    const result = Schema.decodeUnknownSync(LocationFormSchema)(valid)
    expect(result).toEqual(valid)
  })

  it('requires name', () => {
    expect(() => Schema.decodeUnknownSync(LocationFormSchema)({})).toThrow()
  })

  it('transforms form data to Location Clinical Resource', () => {
    const formData: LocationFormData = {
      name: 'Clinic A',
      description: 'Main clinic entrance',
      status: 'active',
      mode: 'instance',
      identifierSystem: 'urn:example:location',
      identifierValue: 'clinic-a',
    }

    expect(transformToLocation(formData)).toEqual({
      resourceType: 'Location',
      name: 'Clinic A',
      description: 'Main clinic entrance',
      status: 'active',
      mode: 'instance',
      identifier: [
        {
          system: 'urn:example:location',
          value: 'clinic-a',
        },
      ],
    })
  })
})
