import { Schema } from 'effect'

import { BackboneElement } from '@assessmentis/clinical-domain/data-types'
import type { BackboneElementEncoded } from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { FhirR4Extension } from '../special-purpose/extension'
import type { BaseUrl } from '../url-identification'
import { ElementEncodedFromFhir } from './element'

export const BackboneElementEncodedFromFhir = <DomainType extends string>(
  domainType: DomainType
): Schema.Schema<BackboneElementEncoded<DomainType>, FhirR4.BackboneElement, BaseUrl> =>
  Schema.extend(
    ElementEncodedFromFhir(domainType),
    mutableEncoded(
      Schema.Struct({
        modifierExtension: Schema.optional(
          mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Extension.EncodedFromExternal)))
        ),
      })
    )
  )

export const FhirR4BackboneElement = {
  Schema: <DomainType extends string>(
    domainType: DomainType
  ): Schema.Schema<BackboneElement<DomainType>, FhirR4.BackboneElement, BaseUrl> =>
    Schema.compose(BackboneElementEncodedFromFhir(domainType), BackboneElement(domainType)),
}
