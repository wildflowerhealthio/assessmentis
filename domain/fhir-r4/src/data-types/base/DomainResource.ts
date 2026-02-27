import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { NarrativeEncodedFromFhir } from '../special-purpose/Narrative'
import { ExtensionEncodedFromFhir } from '../special-purpose/Extension'
import {
  Resource,
  type ResourceEncoded,
} from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ResourceIdentification } from '../UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

export const FhirR4DomainResource = <
  DomainType extends string,
  ResourceType extends string,
>(
  domainType: DomainType,
  resourceType: ResourceType
): Schema.Schema<
  Resource<DomainType>,
  FhirR4.DomainResource & { readonly resourceType: ResourceType },
  BaseUrl
> =>
  Schema.compose(
    ResourceEncodedFromFhirR4DomainResource(domainType, resourceType),
    Resource(domainType)
  )

const ResourceEncodedFromFhirR4DomainResource = <
  DomainType extends string,
  ResourceType extends string,
>(
  domainType: DomainType,
  resourceType: ResourceType
): Schema.Schema<
  ResourceEncoded<DomainType>,
  FhirR4.DomainResource & { readonly resourceType: ResourceType },
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
