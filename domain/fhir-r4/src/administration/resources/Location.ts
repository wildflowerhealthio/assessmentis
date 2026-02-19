import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { Location } from '@assessmentis/clinical-domain/administration'
import {
  LocationId,
  LocationStatus,
  LocationMode,
} from '@assessmentis/clinical-domain/administration'
import { FhirR4DomainResource } from '../../data-types/base/DomainResource'
import { FhirR4Coding } from '../../data-types/complex/Coding'
import { FhirR4ContactPoint } from '../../data-types/complex/ContactPoint'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { FhirR4Address } from '../../data-types/complex/Address'
import {} from '../../FhirR4ResourceBehaviour'

const FhirR4LocationSchema: Schema.Schema<Location, FhirR4.Location, never> =
  Schema.extend(
    FhirR4DomainResource.Schema(LocationId),
    Schema.Struct({
      resourceType: Schema.Literal('Location'),
      operationalStatus: Schema.optional(
        Schema.suspend(() => FhirR4Coding.Schema)
      ),
      identifier: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Identifier.Schema))
        )
      ),
      name: Schema.optional(Schema.String),
      alias: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
      description: Schema.optional(Schema.String),
      status: Schema.optional(LocationStatus),
      mode: Schema.optional(LocationMode),
      type: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
        )
      ),
      telecom: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4ContactPoint.Schema))
        )
      ),
      address: Schema.optional(Schema.suspend(() => FhirR4Address.Schema)),
      physicalType: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.Schema)
      ),
      position: Schema.optional(
        Schema.Struct({
          longitude: Schema.Number,
          latitude: Schema.Number,
          altitude: Schema.optional(Schema.Number),
        })
      ),
      managingOrganization: Schema.optional(
        Schema.suspend(() => FhirR4Reference.Schema)
      ),
      partOf: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
    })
  )

export const FhirR4Location = {
  resourceType: 'Location',
  Schema: FhirR4LocationSchema,
}
