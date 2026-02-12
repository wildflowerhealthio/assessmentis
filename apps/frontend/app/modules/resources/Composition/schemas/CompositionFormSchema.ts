import { Schema, DateTime, Effect } from 'effect'
import type { Composition } from '@assessmentis/clinical-domain/content-management'

export const CompositionFormSchema = Schema.Struct({
  title: Schema.String,
  patientId: Schema.optional(Schema.String),
})

export type CompositionFormData = typeof CompositionFormSchema.Type

export function transformToComposition(
  formData: CompositionFormData
): Omit<Composition, 'id'> {
  return {
    resourceType: 'Composition',
    title: formData.title || 'New Composition',
    status: 'preliminary',
    type: { coding: [] },
    subject: formData.patientId
      ? { reference: `Patient/${formData.patientId}` }
      : {},
    author: [{ display: 'Anonymous' }],
    // Date always reflects the last editing time
    date: Effect.runSync(DateTime.now),
    section: [],
  }
}
