import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { BackboneElement } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Element } from './Element'
import { FhirR4Extension } from '../special-purpose/Extension'

export const FhirR4BackboneElement = {
  Schema: <IdType extends string>(
    idSchema: Schema.Schema<IdType, string>
  ): Schema.Schema<BackboneElement<IdType>, FhirR4.BackboneElement, never> =>
    Schema.extend(
      FhirR4Element.Schema(idSchema),
      Schema.mutable(
        Schema.Struct({
          modifierExtension: Schema.optional(
            Schema.mutable(
              Schema.Array(Schema.suspend(() => FhirR4Extension.Schema))
            )
          ),
        })
      )
    ),
}
