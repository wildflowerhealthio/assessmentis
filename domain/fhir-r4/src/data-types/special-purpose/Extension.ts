import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { Extension } from '@assessmentis/clinical-domain/data-types'
import { FhirR4ValueElement } from '../primitive/ValueElement'
import { FhirR4Element } from '../base/Element'

const ElementId = Schema.String.pipe(Schema.brand('ElementId'))

const ExtensionSchema: Schema.Schema<Extension, FhirR4.Extension, never> =
  Schema.extend(
    Schema.extend(
      FhirR4Element.Schema(ElementId),
      Schema.suspend(() => FhirR4ValueElement.Schema)
    ),
    Schema.mutable(
      Schema.Struct({
        url: Schema.String,
      })
    )
  )

export const FhirR4Extension = {
  Schema: ExtensionSchema,
}
