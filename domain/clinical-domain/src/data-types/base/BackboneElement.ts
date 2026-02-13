import { Schema } from 'effect'
import type { Element } from '../base/Element'
import { ElementFromFhirR4 } from '../base/Element'
import type { Extension } from '../special-purpose/Extension'
import { ExtensionFromFhirR4 } from '../special-purpose/Extension'
import type { BackboneElement as FhirBackboneElement } from 'fhir/r4'
import type { DeepReadonly } from '@assessmentis/util'

export interface BackboneElement<
  TypeId extends string,
> extends Element<TypeId> {
  modifierExtension?: ReadonlyArray<Extension>
}

export const BackboneElementFromFhirR4 = <IdType extends string>(
  idSchema: Schema.Schema<IdType, string>
): Schema.Schema<BackboneElement<IdType>, DeepReadonly<FhirBackboneElement>> =>
  Schema.extend(
    ElementFromFhirR4(idSchema),
    Schema.Struct({
      modifierExtension: Schema.optional(
        Schema.Array(Schema.suspend(() => ExtensionFromFhirR4))
      ),
    })
  )
