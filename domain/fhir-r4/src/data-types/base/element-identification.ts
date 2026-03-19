import { Effect, ParseResult, Schema } from 'effect'

import { BaseUrl, domainIdentification } from '../url-identification'

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
  Schema.transformOrFail(fhirR4ElementIdentification, domainIdentification(domainType), {
    decode: (fhirType) =>
      Effect.gen(function* () {
        const baseUrl = yield* BaseUrl

        return {
          // oxlint-disable-next-line eslint/no-ternary
          url: fhirType.id
            ? baseUrl.appendToPathname(`/${domainType}/${fhirType.id}`).toString()
            : undefined,
          domainType: domainType,
        } as const
      }),
    encode: (source, _, ast) =>
      Effect.gen(function* () {
        const baseUrl = yield* BaseUrl

        if (source.url === undefined) {
          return { id: undefined }
        }

        if (!source.url?.startsWith(baseUrl.toString())) {
          return yield* Effect.fail(
            new ParseResult.Type(ast, source, `URL must contain base URL ${baseUrl.toString()}`)
          )
        }

        return {
          id: source.url?.split('/').pop() ?? undefined,
        }
      }),
    strict: true,
  })
