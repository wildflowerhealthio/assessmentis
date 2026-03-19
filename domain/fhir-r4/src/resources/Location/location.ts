import { Schema } from 'effect'

import { Location, LocationMode, LocationStatus } from '@assessmentis/clinical-domain'
import type { LocationEncoded } from '@assessmentis/clinical-domain'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/resource'
import { FhirR4Address } from '../../data-types/complex/address'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import { FhirR4Coding } from '../../data-types/complex/coding'
import { FhirR4ContactPoint } from '../../data-types/complex/contact-point'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/identifier-and-reference'
import type { BaseUrl } from '../../data-types/url-identification'

const EncodedFromFhir: Schema.Schema<LocationEncoded, FhirR4.Location, BaseUrl> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Location', 'Location'),
  mutableEncoded(
    Schema.Struct({
      address: Schema.optional(Schema.suspend(() => FhirR4Address.EncodedFromExternal)),
      alias: Schema.optional(mutableEncoded(Schema.Array(Schema.String))),
      description: Schema.optional(Schema.String),
      identifier: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)))
      ),
      managingOrganization: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      mode: Schema.optional(LocationMode),
      name: Schema.optional(Schema.String),
      operationalStatus: Schema.optional(Schema.suspend(() => FhirR4Coding.EncodedFromExternal)),
      partOf: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
      physicalType: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      position: Schema.optional(
        Schema.Struct({
          longitude: Schema.Finite,
          latitude: Schema.Finite,
          altitude: Schema.optional(Schema.Finite),
        })
      ),
      status: Schema.optional(LocationStatus),
      telecom: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4ContactPoint.EncodedFromExternal)))
      ),
      type: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
        )
      ),
    })
  )
)

export const FhirR4Location = new TwoStepExternalSchema<
  Location,
  LocationEncoded,
  FhirR4.Location,
  BaseUrl
>(Location, EncodedFromFhir)
