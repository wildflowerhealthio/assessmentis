import { Effect, Schema } from 'effect'
import type fhir from 'fhir/r4'
import type { WithId } from '@assessmentis/effectful-store'
import { hasId } from '@assessmentis/effectful-store'

import { ExtensionFromFhirR4, type Extension } from '../special-purpose'
export interface Element<IdType extends string = string> {
  id?: IdType | undefined
  extension?: Extension[]
}

export const ElementFromFhirR4 = <IdType extends string = string>(
  idSchema: Schema.Schema<IdType, string>
): Schema.Schema<Element<IdType>, fhir.Element, never> =>
  Schema.mutable(
    Schema.Struct({
      id: Schema.optional(idSchema),
      extension: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => ExtensionFromFhirR4)))
      ),
    })
  )
