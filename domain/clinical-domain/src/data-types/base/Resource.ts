import type { Brand } from 'effect'
import { pipe, Schema } from 'effect'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { Code } from '../complex/Code'
import { Meta } from './Meta'
import { Extension, type ExtensionEncoded } from '../special-purpose/Extension'
import { Narrative } from '../special-purpose/Narrative'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Resource<TDomainType extends string> = {
  readonly domainType: TDomainType
  readonly url?: ReadonlyUrl & Brand.Brand<`${TDomainType}/url`>
  readonly meta?: typeof Meta.Type
  readonly implicitRules?: URL
  readonly language?: typeof Code.Type
  readonly text?: typeof Narrative.Type
  readonly contained: ReadonlyArray<unknown>
  readonly extension: ReadonlyArray<Extension>
  readonly modifierExtension: ReadonlyArray<Extension>
}

export interface ResourceEncoded<TDomainType extends string> {
  readonly domainType?: TDomainType | undefined
  readonly url?: string | undefined
  readonly meta?: typeof Meta.Encoded | undefined
  readonly implicitRules?: string | undefined
  readonly language?: typeof Code.Encoded | undefined
  readonly text?: typeof Narrative.Encoded | undefined
  readonly contained?: ReadonlyArray<unknown> | undefined
  readonly extension?: ReadonlyArray<ExtensionEncoded> | undefined
  readonly modifierExtension?: ReadonlyArray<ExtensionEncoded> | undefined
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export const Resource = <TDomainType extends string>(
  domainType: TDomainType
) => {
  const urlSchema = pipe(
    ReadonlyUrl.FromString,
    Schema.brand(`${domainType}/url`)
  )

  const resourceFields = {
    domainType: Schema.Literal(domainType).pipe(
      Schema.optionalWith({
        default: (): TDomainType => domainType,
      })
    ),
    url: Schema.optional(urlSchema),
    /**
     * Metadata about the resource
     */
    meta: Schema.optional(Meta),
    /**
     * A set of rules under which this content was created
     */
    implicitRules: Schema.optional(Schema.URL),
    /**
     * Language of the resource content
     */
    language: Schema.optional(Code),
    /**
     * Text summary of the resource, for human interpretation
     */
    text: Schema.optional(Narrative),
    /**
     * Contained, inline Resources
     */
    contained: Schema.Array(Schema.Any).pipe(
      Schema.optionalWith({
        default: (): ReadonlyArray<unknown> => [],
      })
    ),
    /**
     * Additional content defined by implementations
     */
    extension: pipe(
      Schema.Array(
        Schema.suspend(
          (): Schema.Schema<Extension, ExtensionEncoded, never> => Extension
        )
      ),
      Schema.annotations({
        arbitrary: () => (fc) => fc.constant([]),
        default: [],
      }),
      Schema.optionalWith({
        default: (): ReadonlyArray<Extension> => [],
      })
    ),
    /**
     * Extensions that cannot be ignored
     */
    modifierExtension: pipe(
      Schema.Array(
        Schema.suspend(
          (): Schema.Schema<Extension, ExtensionEncoded, never> => Extension
        )
      ),
      Schema.annotations({
        arbitrary: () => (fc) => fc.constant([]),
        default: [],
      }),
      Schema.optionalWith({
        default: (): ReadonlyArray<Extension> => [],
      })
    ),
  } as const satisfies Schema.Struct.Fields

  class ResourceMixin extends Schema.Class<ResourceMixin>('Resource')(
    resourceFields
  ) {
    static Key = domainType
    static UrlSchema = urlSchema
  }
  return ResourceMixin
}
