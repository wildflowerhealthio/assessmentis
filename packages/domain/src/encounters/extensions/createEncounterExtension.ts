import { Schema } from 'effect'

/**
 * Creates a typed FHIR extension helper for Encounter resources
 * @param url - The FHIR extension URL
 * @param allowMultiple - Whether multiple values are allowed
 */
export function createEncounterExtension<const TUrl extends string>(
  url: TUrl,
  allowMultiple = false
) {
  const ExtensionSchema = Schema.Struct({
    url: Schema.Literal(url),
    valueUrl: Schema.String,
  })

  // Extension type is not exported but used internally

  const getValues = (
    encounter: {
      extension?: ReadonlyArray<{ url: string; valueUrl?: string }>
    }
  ): string[] => {
    if (!encounter.extension) return []
    
    return encounter.extension
      .filter((ext) => ext.url === url && 'valueUrl' in ext)
      .map((ext) => ext.valueUrl as string)
  }

  const getValue = (
    encounter: {
      extension?: ReadonlyArray<{ url: string; valueUrl?: string }>
    }
  ): string | undefined => {
    const values = getValues(encounter)
    return values.length > 0 ? values[0] : undefined
  }

  const withValues = <T extends { extension?: ReadonlyArray<any> }>(
    encounter: T,
    values: string[]
  ): T => {
    const existingExtensions =
      encounter.extension?.filter((ext) => ext.url !== url) ?? []

    const newExtensions = [
      ...existingExtensions,
      ...values.map((value) => ({
        url,
        valueUrl: value,
      })),
    ]

    return {
      ...encounter,
      extension: newExtensions as T['extension'],
    }
  }

  const withValue = <T extends { extension?: ReadonlyArray<any> }>(
    encounter: T,
    value: string | undefined
  ): T => {
    return withValues(encounter, value ? [value] : [])
  }

  return {
    ExtensionSchema,
    url,
    allowMultiple,
    getValues,
    getValue,
    withValues,
    withValue,
  }
}
