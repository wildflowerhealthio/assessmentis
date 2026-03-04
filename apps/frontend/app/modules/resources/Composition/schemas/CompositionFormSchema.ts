import { Schema, DateTime, Effect } from 'effect'
import { Composition, Patient } from '@assessmentis/clinical-domain'
import {
  CodeableConcept,
  Reference,
} from '@assessmentis/clinical-domain/data-types'

export const CompositionFormSchema = Schema.Struct({
  title: Schema.String,
  patientUrl: Schema.optional(Patient.UrlSchema),
})

export type CompositionFormData = typeof CompositionFormSchema.Type

export function transformToComposition(
  formData: CompositionFormData
): Composition {
  return Composition.make({
    title: formData.title || 'New Composition',
    status: 'preliminary',
    type: CodeableConcept.make({ coding: [] }),
    subject: formData.patientUrl
      ? Reference.make({ reference: formData.patientUrl.toString() })
      : undefined,
    author: [Reference.make({ display: 'Anonymous' })],
    date: Effect.runSync(DateTime.now),
    section: [],
  })
}
