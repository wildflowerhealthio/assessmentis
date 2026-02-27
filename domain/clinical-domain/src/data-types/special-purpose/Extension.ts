import { pipe, Schema } from 'effect'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { AllDatatypeKeys, DatatypeChoice } from '../Datatype'
import { MergeClasses } from '@assessmentis/util'

// ---------------------------------------------------------------------------
// Extension
// ---------------------------------------------------------------------------

const ExtensionKey = 'Extension' as const
type ExtensionKey = typeof ExtensionKey

const ValueMixin = DatatypeChoice('value', AllDatatypeKeys)
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

export class Extension extends MergeClasses<Extension>('Extension')(
  ValueMixin,
  {
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
  }
) {
  static Key = ExtensionKey
  static UrlSchema = extensionUrlSchema
}

/**
 * Alias used by StructureDefinition for extensions carrying any value[x] type.
 */
export { Extension as AllValuesExtension }
