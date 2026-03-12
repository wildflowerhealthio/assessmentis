import { pipe, Schema } from 'effect'

import { ReadonlyUrl } from '@assessmentis/effectful-store'

import { AllDatatypeNames, DatatypeChoice } from '../Datatype'

// ---------------------------------------------------------------------------
// Extension
// ---------------------------------------------------------------------------

const ExtensionKey = 'Extension' as const
type ExtensionKey = typeof ExtensionKey

const extensionUrlSchema = pipe(
  ReadonlyUrl.FromString,
  Schema.brand(`${ExtensionKey}/url`)
)

const ValueChoice = DatatypeChoice(AllDatatypeNames)

/** Encoded (wire-format) shape of an {@link Extension}. */
export interface ExtensionEncoded {
  readonly domainType?: ExtensionKey | undefined
  readonly url?: string | undefined
  readonly extension?: ReadonlyArray<ExtensionEncoded> | undefined
  readonly definitionUrl: string
  readonly value?: typeof ValueChoice.Encoded | undefined
}

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
  value: Schema.optional(ValueChoice),
} as const satisfies Schema.Struct.Fields

/**
 * FHIR R4 Extension — carries additional data on any element via a
 * `definitionUrl` and a polymorphic value choice. Extensions can
 * nest recursively via the `extension` array.
 */
export class Extension extends Schema.Class<Extension>('Extension')(
  extensionFields
) {
  static readonly DomainType = ExtensionKey
  static readonly UrlSchema = extensionUrlSchema
  static readonly ValueChoice = ValueChoice
}
