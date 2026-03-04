import {
  Resource,
  type ResourceEncoded,
} from '@assessmentis/clinical-domain/data-types'
import type FhirR4 from 'fhir/r4'
import { mutableEncoded } from '@assessmentis/util'
import { Effect, ParseResult, Schema } from 'effect'
import { FhirR4Narrative, FhirR4Extension } from '../special-purpose'
import { FhirR4Meta } from './Meta'
import { BaseUrl, domainIdentification } from '../UrlIdentification'

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

          if (domainType.url == undefined)
            return { resourceType, id: undefined }

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

          if (fhirType.id == undefined) {
            return { url: undefined, domainType }
          }

          return {
            url: baseUrl
              .appendToPathname(`/${fhirType.resourceType}/${fhirType.id}`)
              .toString(),
            domainType: domainType,
          } as const
        }),
    }
  )

export const FhirR4Resource = <
  DomainType extends string,
  ResourceType extends string,
>(
  domainType: DomainType,
  resourceType: ResourceType
): Schema.Schema<
  Resource<DomainType>,
  FhirR4.Resource & { readonly resourceType: ResourceType },
  BaseUrl
> =>
  Schema.compose(
    ResourceEncodedFromFhirR4Resource(domainType, resourceType),
    Resource(domainType)
  )

export const ResourceEncodedFromFhirR4Resource = <
  DomainType extends string,
  ResourceType extends string,
>(
  domainType: DomainType,
  resourceType: ResourceType
): Schema.Schema<
  ResourceEncoded<DomainType>,
  FhirR4.Resource & { readonly resourceType: ResourceType },
  BaseUrl
> =>
  Schema.extend(
    ResourceIdentification(domainType, resourceType),
    mutableEncoded(
      Schema.Struct({
        meta: Schema.optional(FhirR4Meta.Schema),
        implicitRules: Schema.optional(Schema.String),
        language: Schema.optional(Schema.String),
        text: Schema.optional(FhirR4Narrative.EncodedFromExternal),
        contained: Schema.optional(mutableEncoded(Schema.Array(Schema.Any))),
        extension: Schema.optional(
          mutableEncoded(Schema.Array(FhirR4Extension.EncodedFromExternal))
        ),
        modifierExtension: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Extension.EncodedFromExternal)
            )
          )
        ),
      })
    )
  )
