import { Schema, pipe } from 'effect'
import type { Arbitrary, FastCheck } from 'effect'

import { ReadonlyUrl } from '@assessmentis/effectful-store'

import { makeCloneWith } from '@assessmentis/util'
import { AllDatatypeNames, DatatypeChoice } from '../datatype'

// ---------------------------------------------------------------------------
// Extension
// ---------------------------------------------------------------------------

const ExtensionKey = 'Extension' as const
type ExtensionKey = typeof ExtensionKey

const extensionUrlSchema = pipe(ReadonlyUrl.FromString, Schema.brand(`${ExtensionKey}/url`))

const ValueChoice = DatatypeChoice(AllDatatypeNames)

/** Encoded (wire-format) shape of an {@link Extension}. */
export interface ExtensionEncoded {
  readonly domainType?: ExtensionKey | undefined
  readonly url?: string | undefined
  readonly extension?: readonly ExtensionEncoded[] | undefined
  readonly definitionUrl: string
  readonly value?: typeof ValueChoice.Encoded | undefined
}

const extensionFields = {
  definitionUrl: Schema.String,
  domainType: Schema.Literal(ExtensionKey).pipe(
    Schema.optionalWith({
      default: (): ExtensionKey => ExtensionKey,
    })
  ),
  extension: pipe(
    Schema.Array(Schema.suspend((): Schema.Schema<Extension, ExtensionEncoded> => Extension)),
    Schema.annotations({
      arbitrary: (): Arbitrary.LazyArbitrary<readonly Extension[]> => (fc: typeof FastCheck) =>
        fc.constant([]),
    }),
    Schema.optionalWith({
      default: (): ReadonlyArray<Extension> => [],
    })
  ),
  url: pipe(
    Schema.UndefinedOr(extensionUrlSchema),
    Schema.annotations({
      arbitrary: (): Arbitrary.LazyArbitrary<undefined> => (fc: typeof FastCheck) =>
        fc.constant(undefined),
    }),
    Schema.optionalWith({ default: () => undefined })
  ),
  value: pipe(
    Schema.UndefinedOr(ValueChoice),
    Schema.annotations({
      arbitrary: (): Arbitrary.LazyArbitrary<undefined> => (fc: typeof FastCheck) =>
        fc.constant(undefined),
    }),
    Schema.optionalWith({ default: () => undefined })
  ),
} as const satisfies Schema.Struct.Fields

/**
 * FHIR R4 Extension — carries additional data on any element via a
 * `definitionUrl` and a polymorphic value choice. Extensions can
 * nest recursively via the `extension` array.
 */
export class Extension extends Schema.Class<Extension>('Extension')(extensionFields) {
  static readonly DomainType = ExtensionKey
  static readonly UrlSchema = extensionUrlSchema
  static readonly ValueChoice = ValueChoice

  readonly cloneWith = makeCloneWith(Extension, this)
}
