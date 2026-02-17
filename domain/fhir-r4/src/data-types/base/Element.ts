import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { Element } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Extension } from '../special-purpose/Extension'

export const FhirR4Element = {
  Schema: <IdType extends string = string>(
    idSchema: Schema.Schema<IdType, string>
  ): Schema.Schema<Element<IdType>, FhirR4.Element, never> =>
    Schema.mutable(
      Schema.Struct({
        id: Schema.optional(idSchema),
        extension: Schema.optional(
          Schema.mutable(
            Schema.Array(Schema.suspend(() => FhirR4Extension.Schema))
          )
        ),
      })
    ),
}
