import { describe, expect, it } from 'vitest'
import { Schema } from 'effect'

import { LocationFormData } from './LocationFormData'

describe('LocationFormData', () => {
  it('validates correct form data', () => {
    const valid: typeof LocationFormData.Encoded = {
      name: 'Clinic A',
      description: 'Main clinic entrance',
      status: 'active',
      mode: 'instance',
      identifierSystem: 'urn:example:location',
      identifierValue: 'clinic-a',
    }

    const result = Schema.decodeUnknownSync(LocationFormData)(valid)
    expect(result).toEqual(valid)
  })

  it('requires name', () => {
    expect(() => Schema.decodeUnknownSync(LocationFormData)({})).toThrow()
  })

  it('transforms form data to Location Clinical Resource', () => {
    const formData = LocationFormData.make({
      name: 'Clinic A',
      description: 'Main clinic entrance',
      status: 'active',
      mode: 'instance',
      identifierSystem: 'urn:example:location',
      identifierValue: 'clinic-a',
    })

    const result = formData.toCreatePayload()
    expect(result).toEqual(
      expect.objectContaining({
        domainType: 'Location',
        name: 'Clinic A',
        description: 'Main clinic entrance',
        status: 'active',
        mode: 'instance',
        identifier: [
          expect.objectContaining({
            domainType: 'Identifier',
            system: 'urn:example:location',
            value: 'clinic-a',
          }),
        ],
      })
    )
  })
})
