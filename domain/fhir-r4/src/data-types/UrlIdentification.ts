import { Context, Effect, ParseResult, Schema } from 'effect'
import type { ReadonlyUrl } from '@assessmentis/effectful-store'
import { mutableEncoded } from '@assessmentis/util'

export class BaseUrl extends Context.Tag('BaseUrl')<BaseUrl, ReadonlyUrl>() {}

const domainIdentification = <TDomainType extends string>(
  domainType: TDomainType
) =>
  mutableEncoded(
    Schema.Struct({
      domainType: Schema.optional(Schema.Literal(domainType)),
      url: Schema.optional(Schema.String),
    })
  )

const fhirR4ResourceIdentification = <TResourceType extends string>(
  resourceType: TResourceType
) =>
  Schema.extend(
    Schema.Struct({
      resourceType: Schema.Literal(resourceType),
    }),
    mutableEncoded(
      Schema.Struct({
        id: Schema.optional(Schema.String),
      })
    )
  )

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
          // Use service to validate ID

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

export const ResourceIdentification = <
  TDomainType extends string,
  TResourceType extends string,
>(
  domainType: TDomainType,
  resourceType: TResourceType
): Schema.Schema<
  { readonly url?: string; readonly domainType?: TDomainType | undefined },
  { id?: string; readonly resourceType: TResourceType },
  BaseUrl
> =>
  Schema.transformOrFail(
    fhirR4ResourceIdentification(resourceType),
    domainIdentification(domainType),
    {
      strict: true,
      encode: (domainType, _, ast) =>
        Effect.gen(function* () {
          const baseUrl = yield* BaseUrl
          // Use service to validate ID

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
            resourceType,
            id: domainType.url?.split('/').pop() ?? undefined,
          }
        }),
      decode: (fhirType) =>
        Effect.gen(function* () {
          const baseUrl = yield* BaseUrl

          return {
            url: baseUrl
              .appendToPathname(`${fhirType.resourceType}/${fhirType.id}`)
              .toString(),
            domainType: domainType,
          } as const
        }),
    }
  )
