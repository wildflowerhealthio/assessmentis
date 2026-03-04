import { Effect, ParseResult, Schema } from 'effect'

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

          if (domainType.url == undefined) return { id: undefined }

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
            url: fhirType.id
              ? baseUrl
                  .appendToPathname(`/${domainType}/${fhirType.id}`)
                  .toString()
              : undefined,
            domainType: domainType,
          } as const
        }),
    }
  )
