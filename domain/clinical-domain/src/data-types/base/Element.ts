import type { Brand } from 'effect'
import { pipe, Schema } from 'effect'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { Extension, type ExtensionEncoded } from '../special-purpose/Extension'

// Re-export so barrel consumers that previously got Extension from ./base
// continue to resolve. Note: special-purpose/index.ts also re-exports
// Extension; the base/index.ts barrel should NOT re-export Extension to
// avoid duplicate-export ambiguity in data-types/index.ts.

// ---------------------------------------------------------------------------
// Element
// ---------------------------------------------------------------------------

export const Element = <TDomainType extends string>(
  domainType: TDomainType
) => {
  const urlSchema = pipe(
    ReadonlyUrl.FromString,
    Schema.brand(`${domainType}/url`)
  )

  const fields = {
    domainType: Schema.Literal(domainType).pipe(
      Schema.optionalWith({
        default: (): TDomainType => domainType,
      })
    ),
    url: Schema.optional(urlSchema),
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
  } as const satisfies Schema.Struct.Fields

  return class ElementMixin extends Schema.Class<ElementMixin>('Element')(
    fields
  ) {
    static Key = domainType
    static UrlSchema = urlSchema
  }
}

export type Element<TDomainType extends string> = {
  readonly domainType: TDomainType
  readonly url?: ReadonlyUrl & Brand.Brand<`${TDomainType}/url`>
  readonly extension: ReadonlyArray<Extension>
}

export interface ElementEncoded<TDomainType extends string> {
  readonly domainType?: TDomainType | undefined
  readonly url?: string | undefined
  readonly extension?: ReadonlyArray<ExtensionEncoded> | undefined
}
