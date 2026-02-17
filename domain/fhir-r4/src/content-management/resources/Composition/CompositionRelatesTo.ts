import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { CompositionRelatesTo } from '@assessmentis/clinical-domain/content-management'
import { FhirR4BackboneElement } from '../../../data-types/base/BackboneElement'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../../data-types/complex/IdentifierAndReference'

const CompositionRelatesToId = Schema.String.pipe(
  Schema.brand('CompositionRelatesToId')
)

const FhirR4CompositionRelatesToSchema: Schema.Schema<
  CompositionRelatesTo,
  FhirR4.CompositionRelatesTo,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(CompositionRelatesToId),
  Schema.Struct({
    code: Schema.Union(
      Schema.Literal('replaces'),
      Schema.Literal('transforms'),
      Schema.Literal('signs'),
      Schema.Literal('appends')
    ),
    targetIdentifier: Schema.optional(
      Schema.suspend(() => FhirR4Identifier.Schema)
    ),
    targetReference: Schema.optional(
      Schema.suspend(() => FhirR4Reference.Schema)
    ),
  })
)

export const FhirR4CompositionRelatesTo = {
  Schema: FhirR4CompositionRelatesToSchema,
}
