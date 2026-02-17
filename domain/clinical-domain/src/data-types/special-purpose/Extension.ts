import { Schema } from 'effect'
import type { ValueElementEncoded } from '../primitive/ValueElement'
import { ValueElement } from '../primitive/ValueElement'
import type { ElementEncoded } from '../base/Element'
import { Element } from '../base/Element'

const ElementId = Schema.String.pipe(Schema.brand('ElementId'))
type ElementId = typeof ElementId.Type

export interface Extension extends ValueElement, Element<ElementId> {
  url: string
}

export interface ExtensionEncoded extends ValueElementEncoded, ElementEncoded {
  url: string
}

const ExtensionSchema: Schema.Schema<Extension, ExtensionEncoded, never> =
  Schema.extend(
    Schema.extend(
      Element.Schema(ElementId),
      Schema.suspend(
        (): Schema.Schema<ValueElement, ValueElementEncoded, never> =>
          ValueElement.Schema
      )
    ),
    Schema.mutable(
      Schema.Struct({
        url: Schema.String,
      })
    )
  )

export const Extension = {
  Schema: ExtensionSchema,
}

/**
 * Creates a typed FHIR extension helper
 * @param url - The FHIR extension URL
 * @param valueKey - The key name for the value (e.g., 'valueUrl', 'valueString')
 * @param ValueSchema - The schema for the value
 */
export const createExtension = <
  const TUrl extends string,
  ValueKey extends string,
  A,
  I = A,
>(
  url: TUrl,
  valueKey: Exclude<ValueKey, 'url'>,
  ValueSchema: Schema.Schema<A, I, never>
): {
  ExtensionSchema: Schema.extend<
    Schema.Struct<{
      url: Schema.Schema<TUrl, TUrl>
    }>,
    Schema.Record$<
      Schema.Schema<ValueKey, ValueKey>,
      Schema.Schema<A, I, never>
    >
  >
  url: TUrl
  valueKey: ValueKey
  getValues: (resource: {
    extension?: ReadonlyArray<
      { url: string } | ({ url: TUrl } & { [K in ValueKey]: A })
    >
  }) => A[]
  withValues: <
    T extends {
      extension?: ReadonlyArray<{ url: string } | { url: TUrl; [valueKey]: A }>
    },
  >(
    resource: T,
    values: A[]
  ) => T
} => {
  // Note: ExtensionSchema typing is complex due to dynamic keys,
  // so we use any and rely on runtime schema validation
  const WronglyTypedExtensionSchema = Schema.Struct({
    [valueKey]: ValueSchema,
    url: Schema.Literal(url),
  })

  const ExtensionSchema =
    WronglyTypedExtensionSchema as unknown as Schema.extend<
      Schema.Struct<{
        url: Schema.Schema<TUrl, TUrl>
      }>,
      Schema.Record$<
        Schema.Schema<ValueKey, ValueKey>,
        Schema.Schema<A, I, never>
      >
    >

  type ExtensionType = { url: TUrl } & { [K in ValueKey]: A }

  const getValues = (resource: {
    extension?: ReadonlyArray<{ url: string } | ExtensionType>
  }): A[] => {
    if (!resource.extension) return []

    return resource.extension
      .filter((ext): ext is ExtensionType => ext.url === url && valueKey in ext)
      .map((ext) => ext[valueKey])
  }

  const withValues = <
    T extends {
      extension?: ReadonlyArray<{ url: string } | { url: TUrl; [valueKey]: A }>
    },
  >(
    resource: T,
    values: A[]
  ): T => {
    const existingExtensions =
      resource.extension?.filter((ext) => ext.url !== url) ?? []

    const newExtensions = [
      ...existingExtensions,
      ...values.map((value) => ({
        url,
        [valueKey]: value,
      })),
    ]

    return {
      ...resource,
      extension: newExtensions,
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
