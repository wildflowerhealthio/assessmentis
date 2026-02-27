import { Schema, DateTime, Effect } from 'effect'
import { Composition } from '@assessmentis/clinical-domain'
import {
  CodeableConcept,
  IdentifierAndReference,
} from '@assessmentis/clinical-domain/data-types'

export const CompositionFormSchema = Schema.Struct({
  title: Schema.String,
  patientId: Schema.optional(Schema.String),
})

export type CompositionFormData = typeof CompositionFormSchema.Type

export function transformToComposition(
  formData: CompositionFormData
): Composition {
  return Composition.make({
    title: formData.title || 'New Composition',
    status: 'preliminary',
    type: CodeableConcept.make({ coding: [] }),
    subject: formData.patientId
      ? IdentifierAndReference.Reference.make({ reference: `Patient/${formData.patientId}` })
      : undefined,
    author: [IdentifierAndReference.Reference.make({ display: 'Anonymous' })],
    date: Effect.runSync(DateTime.now),
    section: [],
  })
}
