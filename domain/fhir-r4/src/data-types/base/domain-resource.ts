import { Schema } from 'effect'

import { Resource } from '@assessmentis/clinical-domain/data-types'
import type { ResourceEncoded } from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { FhirR4Extension } from '../special-purpose/extension'
import { FhirR4Narrative } from '../special-purpose/narrative'
import type { BaseUrl } from '../url-identification'
import { ResourceIdentification } from './resource'

export const FhirR4DomainResource = <DomainType extends string, ResourceType extends string>(
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
        contained: Schema.optional(mutableEncoded(Schema.Array(Schema.Any))),
        extension: Schema.optional(
          mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Extension.EncodedFromExternal)))
        ),
        modifierExtension: Schema.optional(
          mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Extension.EncodedFromExternal)))
        ),
        text: Schema.optional(FhirR4Narrative.EncodedFromExternal),
      })
    )
  )
