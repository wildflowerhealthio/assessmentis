import { Schema, DateTime, Effect } from 'effect'
import { Composition } from '@assessmentis/clinical-domain/content-management'

export const CompositionFormSchema = Schema.Struct({
  title: Schema.String,
  patientId: Schema.optional(Schema.String),
  date: Schema.optional(Schema.DateTimeUtc),
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
    date: formData.date
      ? DateTime.unsafeMake(formData.date)
      : Effect.runSync(DateTime.now),
    section: [],
  }
}
