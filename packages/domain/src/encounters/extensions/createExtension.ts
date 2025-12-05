import { Schema } from 'effect'

/**
 * Creates a typed FHIR extension helper
 * @param url - The FHIR extension URL
 * @param valueKey - The key name for the value (e.g., 'valueUrl', 'valueString')
 * @param ValueSchema - The schema for the value
 */
export function createExtension<
  const TUrl extends string,
  ValueKey extends string,
  A,
  I = A,
>(url: TUrl, valueKey: ValueKey, ValueSchema: Schema.Schema<A, I, never>) {
  // Note: ExtensionSchema typing is complex due to dynamic keys,
  // so we use any and rely on runtime schema validation
  const ExtensionSchema = Schema.Struct({
    url: Schema.Literal(url),
    [valueKey]: ValueSchema,
  })

  type ExtensionType = { url: TUrl } & { [K in ValueKey]: A }

  const getValues = (resource: {
    extension?: ReadonlyArray<{ url: string } | ExtensionType>
  }): A[] => {
    if (!resource.extension) return []

    return resource.extension
      .filter((ext): ext is ExtensionType => ext.url === url && valueKey in ext)
      .map((ext) => ext[valueKey])
  }

  const withValues = <T extends { extension?: ReadonlyArray<any> }>(
    resource: T,
    values: A[]
  ): T => {
    const existingExtensions =
      resource.extension?.filter((ext) => ext.url !== url) ?? []

    const newExtensions = [
      ...existingExtensions,
      ...values.map(
        (value) =>
          ({
            url,
            [valueKey]: value,
          }) as ExtensionType
      ),
    ]

    return {
      ...resource,
      extension: newExtensions as T['extension'],
    }
  }

  return {
    ExtensionSchema,
    url,
    valueKey,
    getValues,
    withValues,
  }
}
