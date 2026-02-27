import {
  Resource,
  type ResourceEncoded,
} from '@assessmentis/clinical-domain/data-types'
import type FhirR4 from 'fhir/r4'
import { mutableEncoded } from '@assessmentis/util'
import { Schema } from 'effect'
import {
  NarrativeEncodedFromFhir,
  ExtensionEncodedFromFhir,
} from '../special-purpose'
import type { BaseUrl } from '../UrlIdentification'
import { ResourceIdentification } from '../UrlIdentification'

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
        text: Schema.optional(NarrativeEncodedFromFhir),
        contained: Schema.optional(mutableEncoded(Schema.Array(Schema.Any))),
        extension: Schema.optional(
          mutableEncoded(
            Schema.Array(Schema.suspend(() => ExtensionEncodedFromFhir))
          )
        ),
        modifierExtension: Schema.optional(
          mutableEncoded(
            Schema.Array(Schema.suspend(() => ExtensionEncodedFromFhir))
          )
        ),
      })
    )
  )
