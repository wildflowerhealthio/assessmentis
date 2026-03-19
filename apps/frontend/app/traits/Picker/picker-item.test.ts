import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { Location } from '@assessmentis/clinical-domain'

// eslint-disable-next-line import/no-unassigned-import -- Loads trait barrel to register implementations for testing
import '.'

const decode = Schema.decodeSync(Location)

describe('Location PickerItem extension', () => {
  it('uses location name as display', () => {
    const location = decode({ name: 'Clinic A' })

    expect(location.PickerItem.display).toBe('Clinic A')
  })

  it('uses description as secondary', () => {
    const location = decode({
      description: 'Main clinic entrance',
      name: 'Clinic A',
    })

    expect(location.PickerItem.secondary).toBe('Main clinic entrance')
  })

  it('falls back to status when description is missing', () => {
    const location = decode({ name: 'Clinic A', status: 'active' })

    expect(location.PickerItem.secondary).toBe('active')
  })

  it('falls back to empty string when both description and status are missing', () => {
    const location = decode({ name: 'Clinic A' })

    expect(location.PickerItem.secondary).toBe('')
  })

  it('falls back to identifier when name is missing', () => {
    const location = decode({
      identifier: [{ system: 'urn:example', value: 'loc-42' }],
    })

    expect(location.PickerItem.display).toBe('loc-42')
  })

  it('falls back to url string when name and identifier are missing', () => {
    const location = decode({ url: 'http://example.com/Location/1' })

    expect(location.PickerItem.display).toContain('Location')
  })

  it('falls back to "Location Unknown" when nothing is available', () => {
    const location = decode({})

    expect(location.PickerItem.display).toBe('Location Unknown')
  })

  it('sets id from url', () => {
    const location = decode({
      name: 'Clinic A',
      url: 'http://example.com/Location/1',
    })

    expect(location.PickerItem.id).toBe(location.url!.toString())
  })

  it('sets id to empty string when url is missing', () => {
    const location = decode({ name: 'Clinic A' })

    expect(location.PickerItem.id).toBe('')
  })

  it('exposes static PickerItem.Placeholder', () => {
    expect(Location.PickerItem.Placeholder).toBe('Select a location...')
  })

  it('exposes static PickerItem.Label', () => {
    expect(Location.PickerItem.Label).toBe('Location')
  })
})
