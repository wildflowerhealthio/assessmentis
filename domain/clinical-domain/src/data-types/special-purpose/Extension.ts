import { Schema } from 'effect'
import {
  ValueElementFromFhirR4,
  type ValueElement,
} from '../primitive/ValueElement'
import type { Extension as FhirExtension } from 'fhir/r4'
import type { DeepReadonly } from '@assessmentis/util'

export type Extension = {
  url: string
} & ValueElement

export const ExtensionFromFhirR4: Schema.Schema<
  Extension,
  Pick<
    DeepReadonly<FhirExtension>,
    'url' | keyof typeof ValueElementFromFhirR4.Encoded
  >,
  never
> = Schema.extend(
  Schema.Struct({
    url: Schema.String,
  }),
  Schema.suspend(() => ValueElementFromFhirR4)
)

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
