import { Schema } from 'effect'

import type { ElementEncoded } from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { FhirR4Extension } from '../special-purpose/Extension'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from './ElementIdentification'

export const ElementEncodedFromFhir = <DomainType extends string>(
  domainType: DomainType
): Schema.Schema<ElementEncoded<DomainType>, FhirR4.Element, BaseUrl> =>
  Schema.extend(
    ElementIdentification(domainType),
    mutableEncoded(
      Schema.Struct({
        extension: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Extension.EncodedFromExternal)
            )
          )
        ),
      })
    )
  )
