import { Schema } from 'effect'
import type { Element } from '../base/Element'
import { ElementFromFhirR4 } from '../base/Element'
import type { Extension } from '../special-purpose/Extension'
import { ExtensionFromFhirR4 } from '../special-purpose/Extension'
import type fhir from 'fhir/r4'

export interface BackboneElement<
  TypeId extends string,
> extends Element<TypeId> {
  modifierExtension?: Extension[]
}

export const BackboneElementFromFhirR4 = <IdType extends string>(
  idSchema: Schema.Schema<IdType, string>
): Schema.Schema<BackboneElement<IdType>, fhir.BackboneElement, never> =>
  Schema.extend(
    ElementFromFhirR4(idSchema),
    Schema.mutable(
      Schema.Struct({
        modifierExtension: Schema.optional(
          Schema.mutable(
            Schema.Array(Schema.suspend(() => ExtensionFromFhirR4))
          )
        ),
      })
    )
  )
