import { pipe, Schema } from 'effect'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { AllDatatypeKeys, DatatypeChoice } from '../Datatype'

// ---------------------------------------------------------------------------
// Extension
// ---------------------------------------------------------------------------

const ExtensionKey = 'Extension' as const
type ExtensionKey = typeof ExtensionKey

const ValueMixin = DatatypeChoice('value', [...AllDatatypeKeys])

export interface ExtensionEncoded extends Schema.Struct.Encoded<
  typeof ValueMixin.fields
> {
  readonly url?: string | undefined
  readonly domainType?: ExtensionKey | undefined
  readonly extension?: ReadonlyArray<ExtensionEncoded>
  readonly definitionUrl: string
}

const extensionUrlSchema = pipe(
  ReadonlyUrl.FromString,
  Schema.brand(`${ExtensionKey}/url`)
)

export class Extension extends Schema.Class<Extension>('Extension')({
  domainType: Schema.Literal(ExtensionKey).pipe(
    Schema.optionalWith({
      default: (): ExtensionKey => ExtensionKey,
    })
  ),
  url: Schema.optional(extensionUrlSchema),
  extension: pipe(
    Schema.Array(
      Schema.suspend(
        (): Schema.Schema<Extension, ExtensionEncoded, never> => Extension
      )
    ),
    Schema.annotations({
      arbitrary: () => (fc) => fc.constant([]),
    }),
    Schema.optionalWith({
      default: (): ReadonlyArray<Extension> => [],
    })
  ),
  definitionUrl: Schema.String,
  ...ValueMixin.fields,
}) {
  static Key = ExtensionKey
  static UrlSchema = extensionUrlSchema

  static allOptionKeys() {
    return ValueMixin.allOptionKeys()
  }

  isExactlyOnePresent(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ValueMixin.prototype.isExactlyOnePresent.call(this as any)
  }

  isNonePresent(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ValueMixin.prototype.isNonePresent.call(this as any)
  }
}

/**
 * Alias used by StructureDefinition for extensions carrying any value[x] type.
 */
export { Extension as AllValuesExtension }
