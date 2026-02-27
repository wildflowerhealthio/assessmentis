import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  BackboneElement,
  type BackboneElementEncoded,
} from '@assessmentis/clinical-domain/data-types'
import { ElementEncodedFromFhir } from './Element'
import { ExtensionEncodedFromFhir } from '../special-purpose/Extension'
import { mutableEncoded } from '@assessmentis/util'
import type { BaseUrl } from '../UrlIdentification'

export const BackboneElementEncodedFromFhir = <DomainType extends string>(
  domainType: DomainType
): Schema.Schema<
  BackboneElementEncoded<DomainType>,
  FhirR4.BackboneElement,
  BaseUrl
> =>
  Schema.extend(
    ElementEncodedFromFhir(domainType),
    mutableEncoded(
      Schema.Struct({
        modifierExtension: Schema.optional(
          mutableEncoded(
            Schema.Array(Schema.suspend(() => ExtensionEncodedFromFhir))
          )
        ),
      })
    )
  )

export const FhirR4BackboneElement = {
  Schema: <DomainType extends string>(
    domainType: DomainType
  ): Schema.Schema<
    BackboneElement<DomainType>,
    FhirR4.BackboneElement,
    BaseUrl
  > =>
    Schema.compose(
      BackboneElementEncodedFromFhir(domainType),
      BackboneElement(domainType)
    ),
}
