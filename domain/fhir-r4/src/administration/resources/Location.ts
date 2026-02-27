import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { Location, type LocationEncoded } from '@assessmentis/clinical-domain'
import { LocationStatus, LocationMode } from '@assessmentis/clinical-domain'
import { CodingEncodedFromFhir } from '../../data-types/complex/Coding'
import { ContactPointEncodedFromFhir } from '../../data-types/complex/ContactPoint'
import {
  IdentifierEncodedFromFhir,
  ReferenceEncodedFromFhir,
} from '../../data-types/complex/IdentifierAndReference'
import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import { CodeableConceptEncodedFromFhir } from '../../data-types/complex/CodeableConcept'
import { AddressEncodedFromFhir } from '../../data-types/complex/Address'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

const FhirR4LocationSchema: Schema.Schema<
  LocationEncoded,
  FhirR4.Location,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Location', 'Location'),
  mutableEncoded(
    Schema.Struct({
      operationalStatus: Schema.optional(
        Schema.suspend(() => CodingEncodedFromFhir)
      ),
      identifier: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => IdentifierEncodedFromFhir))
        )
      ),
      name: Schema.optional(Schema.String),
      alias: Schema.optional(mutableEncoded(Schema.Array(Schema.String))),
      description: Schema.optional(Schema.String),
      status: Schema.optional(LocationStatus),
      mode: Schema.optional(LocationMode),
      type: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      telecom: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ContactPointEncodedFromFhir))
        )
      ),
      address: Schema.optional(Schema.suspend(() => AddressEncodedFromFhir)),
      physicalType: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      position: Schema.optional(
        Schema.Struct({
          longitude: Schema.Number,
          latitude: Schema.Number,
          altitude: Schema.optional(Schema.Number),
        })
      ),
      managingOrganization: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      partOf: Schema.optional(Schema.suspend(() => ReferenceEncodedFromFhir)),
    })
  )
)

export const FhirR4Location = {
  resourceType: 'Location',
  Schema: Schema.compose(FhirR4LocationSchema, Location),
}
