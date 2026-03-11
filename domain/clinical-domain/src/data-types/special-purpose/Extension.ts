import { pipe, Schema } from 'effect'

import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { mergeArbitraries, MergeClasses } from '@assessmentis/util'

import { AllDatatypeKeys, DatatypeChoice } from '../Datatype'

// ---------------------------------------------------------------------------
// Extension
// ---------------------------------------------------------------------------

const ExtensionKey = 'Extension' as const
type ExtensionKey = typeof ExtensionKey

class ExtensionValue extends DatatypeChoice<
  ExtensionValue,
  'value',
  typeof AllDatatypeKeys
>('ExtensionValue', 'value', AllDatatypeKeys) {}

/** Encoded (wire-format) shape of an {@link Extension}. */
export interface ExtensionEncoded extends Schema.Struct.Encoded<
  typeof ExtensionValue.fields
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

const extensionFields = {
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
} as const satisfies Schema.Struct.Fields

/**
 * FHIR R4 Extension — carries additional data on any element via a
 * `definitionUrl` and a polymorphic value\[x\] choice. Extensions can
 * nest recursively via the `extension` array.
 *
 * @remarks
 * Composes the `DatatypeChoice` mixin (all FHIR R4 data type value\[x\] fields)
 * with Element-like fields (`domainType`, `url`, `extension`). The arbitrary
 * generates instances with zero or one value\[x\] key set.
 */
export class Extension extends MergeClasses<Extension>('Extension')(
  [
    {
      arbitrary: () =>
        mergeArbitraries(
          (props) => new Extension(props),
          ExtensionValue.arbitraryValueOneOrNone,
          extensionFields
        ),
    },
  ],
  ExtensionValue,
  extensionFields
) {
  static DomainType = ExtensionKey
  static UrlSchema = extensionUrlSchema
}

/**
 * Alias used by StructureDefinition for extensions carrying any value[x] type.
 */
export { Extension as AllValuesExtension }
