import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { Narrative } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Element } from '../base/Element'

const NarrativeId = Schema.String.pipe(Schema.brand('NarrativeId'))

const NarrativeStatus = Schema.Union(
  Schema.Literal('generated'),
  Schema.Literal('extensions'),
  Schema.Literal('additional'),
  Schema.Literal('empty')
)

const NarrativeSchema: Schema.Schema<Narrative, FhirR4.Narrative, never> =
  Schema.extend(
    FhirR4Element.Schema(NarrativeId),
    Schema.mutable(
      Schema.Struct({
        status: NarrativeStatus,
        div: Schema.String,
      })
    )
  )

export const FhirR4Narrative = {
  Schema: NarrativeSchema,
}
