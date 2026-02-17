import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { CompositionAttester } from '@assessmentis/clinical-domain/content-management'
import {
  CompositionAttesterId,
  CompositionAttesterMode,
} from '@assessmentis/clinical-domain/content-management'
import { FhirR4BackboneElement } from '../../../data-types/base/BackboneElement'
import { FhirR4Reference } from '../../../data-types/complex/IdentifierAndReference'

const FhirR4CompositionAttesterSchema: Schema.Schema<
  CompositionAttester,
  FhirR4.CompositionAttester,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(CompositionAttesterId),
  Schema.Struct({
    mode: CompositionAttesterMode,
    time: Schema.optional(Schema.String),
    party: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
  })
)

export const FhirR4CompositionAttester = {
  Schema: FhirR4CompositionAttesterSchema,
}
