import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type {
  Reference,
  Identifier,
} from '@assessmentis/clinical-domain/data-types'
import {
  ReferenceId,
  IdentifierId,
} from '@assessmentis/clinical-domain/data-types'
import { FhirR4Element } from '../base/Element'
import { FhirR4CodeableConcept } from './CodeableConcept'
import { FhirR4Period } from './Period'

const FhirR4ReferenceSchema: Schema.Schema<
  Reference,
  FhirR4.Reference,
  never
> = Schema.extend(
  FhirR4Element.Schema(ReferenceId),
  Schema.mutable(
    Schema.Struct({
      display: Schema.optional(Schema.String),
      reference: Schema.optional(Schema.String),
      type: Schema.optional(Schema.String),
      identifier: Schema.optional(
        Schema.suspend(() => FhirR4Identifier.Schema)
      ),
    })
  )
)

export const FhirR4Reference = {
  Schema: FhirR4ReferenceSchema,
}

const IdentifierUse = Schema.Enums({
  usual: 'usual',
  official: 'official',
  temp: 'temp',
  secondary: 'secondary',
  old: 'old',
} as const)

const FhirR4IdentifierSchema: Schema.Schema<
  Identifier,
  FhirR4.Identifier,
  never
> = Schema.extend(
  FhirR4Element.Schema(IdentifierId),
  Schema.mutable(
    Schema.Struct({
      period: Schema.optional(Schema.suspend(() => FhirR4Period.Schema)),
      system: Schema.optional(Schema.String),
      type: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.Schema)
      ),
      use: Schema.optional(IdentifierUse),
      value: Schema.optional(Schema.String),
      assigner: Schema.optional(
        Schema.suspend(() => FhirR4Reference.Schema)
      ),
    })
  )
)

export const FhirR4Identifier = {
  Schema: FhirR4IdentifierSchema,
}
