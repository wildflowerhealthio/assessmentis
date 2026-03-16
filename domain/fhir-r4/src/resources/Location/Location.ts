import { Schema } from 'effect'

import {
  Location,
  LocationMode,
  LocationStatus,
} from '@assessmentis/clinical-domain'
import type { LocationEncoded } from '@assessmentis/clinical-domain'
import { mutableEncoded, TwoStepExternalSchema } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import { FhirR4Address } from '../../data-types/complex/Address'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { FhirR4Coding } from '../../data-types/complex/Coding'
import { FhirR4ContactPoint } from '../../data-types/complex/ContactPoint'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import type { BaseUrl } from '../../data-types/UrlIdentification'

const EncodedFromFhir: Schema.Schema<
  LocationEncoded,
  FhirR4.Location,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Location', 'Location'),
  mutableEncoded(
    Schema.Struct({
      operationalStatus: Schema.optional(
        Schema.suspend(() => FhirR4Coding.EncodedFromExternal)
      ),
      identifier: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)
          )
        )
      ),
      name: Schema.optional(Schema.String),
      alias: Schema.optional(mutableEncoded(Schema.Array(Schema.String))),
      description: Schema.optional(Schema.String),
      status: Schema.optional(LocationStatus),
      mode: Schema.optional(LocationMode),
      type: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
          )
        )
      ),
      telecom: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4ContactPoint.EncodedFromExternal)
          )
        )
      ),
      address: Schema.optional(
        Schema.suspend(() => FhirR4Address.EncodedFromExternal)
      ),
      physicalType: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      position: Schema.optional(
        Schema.Struct({
          longitude: Schema.Number,
          latitude: Schema.Number,
          altitude: Schema.optional(Schema.Number),
        })
      ),
      managingOrganization: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      partOf: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
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
