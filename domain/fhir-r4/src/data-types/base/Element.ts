import { Effect, ParseResult, Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { ElementEncoded } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Extension } from '../special-purpose/Extension'
import { mutableEncoded } from '@assessmentis/util'
import { BaseUrl, domainIdentification } from '../UrlIdentification'

const fhirR4ElementIdentification = Schema.mutable(
  Schema.Struct({
    id: Schema.optional(Schema.String),
  })
)

export const ElementIdentification = <TDomainType extends string>(
  domainType: TDomainType
): Schema.Schema<
  { readonly url?: string; readonly domainType?: TDomainType | undefined },
  { id?: string },
  BaseUrl
> =>
  Schema.transformOrFail(
    fhirR4ElementIdentification,
    domainIdentification(domainType),
    {
      strict: true,
      encode: (domainType, _, ast) =>
        Effect.gen(function* () {
          const baseUrl = yield* BaseUrl

          if (!domainType.url?.startsWith(baseUrl.toString())) {
            return yield* Effect.fail(
              new ParseResult.Type(
                ast,
                domainType,
                `URL must contain base URL ${baseUrl}`
              )
            )
          }

          return {
            id: domainType.url?.split('/').pop() ?? undefined,
          }
        }),
      decode: (fhirType) =>
        Effect.gen(function* () {
          const baseUrl = yield* BaseUrl

          return {
            url: baseUrl
              .appendToPathname(`${domainType}/${fhirType.id}`)
              .toString(),
            domainType: domainType,
          } as const
        }),
    }
  )

export const ElementEncodedFromFhir = <DomainType extends string>(
  domainType: DomainType
): Schema.Schema<ElementEncoded<DomainType>, FhirR4.Element, BaseUrl> =>
  Schema.extend(
    ElementIdentification(domainType),
    mutableEncoded(
      Schema.Struct({
        extension: Schema.optional(
          mutableEncoded(
            Schema.Array(Schema.suspend(() => FhirR4Extension.EncodedFromExternal))
          )
        ),
      })
    )
  )
