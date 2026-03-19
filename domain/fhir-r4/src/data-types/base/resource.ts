import { Effect, ParseResult, Schema } from 'effect'

import { Resource } from '@assessmentis/clinical-domain/data-types'
import type { ResourceEncoded } from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { FhirR4Extension, FhirR4Narrative } from '../special-purpose'
import { BaseUrl, domainIdentification } from '../url-identification'
import { FhirR4Meta } from './meta'

// oxlint-disable-next-line typescript-eslint/explicit-function-return-type -- return type depends on generic schema parameter
const fhirR4ResourceIdentification = <TResourceType extends string>(resourceType: TResourceType) =>
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

export const ResourceIdentification = <TDomainType extends string, TResourceType extends string>(
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
      decode: (fhirType) =>
        Effect.gen(function* () {
          const baseUrl = yield* BaseUrl

          if (fhirType.id === undefined) {
            return { url: undefined, domainType }
          }

          return {
            url: baseUrl.appendToPathname(`/${fhirType.resourceType}/${fhirType.id}`).toString(),
            domainType: domainType,
          } as const
        }),
      encode: (identification, _, ast) =>
        Effect.gen(function* () {
          const baseUrl = yield* BaseUrl

          if (identification.url === undefined) {
            return { resourceType, id: undefined }
          }

          if (!identification.url?.startsWith(baseUrl.toString())) {
            return yield* Effect.fail(
              new ParseResult.Type(
                ast,
                identification,
                `URL must contain base URL ${baseUrl.toString()}`
              )
            )
          }

          return {
            resourceType,
            id: identification.url?.split('/').pop() ?? undefined,
          }
        }),
      strict: true,
    }
  )

export const FhirR4Resource = <DomainType extends string, ResourceType extends string>(
  domainType: DomainType,
  resourceType: ResourceType
): Schema.Schema<
  Resource<DomainType>,
  FhirR4.Resource & { readonly resourceType: ResourceType },
  BaseUrl
> =>
  Schema.compose(ResourceEncodedFromFhirR4Resource(domainType, resourceType), Resource(domainType))

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
        contained: Schema.optional(mutableEncoded(Schema.Array(Schema.Any))),
        extension: Schema.optional(
          mutableEncoded(Schema.Array(FhirR4Extension.EncodedFromExternal))
        ),
        implicitRules: Schema.optional(Schema.String),
        language: Schema.optional(Schema.String),
        meta: Schema.optional(FhirR4Meta.Schema),
        modifierExtension: Schema.optional(
          mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Extension.EncodedFromExternal)))
        ),
        text: Schema.optional(FhirR4Narrative.EncodedFromExternal),
      })
    )
  )
