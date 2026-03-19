import { DateTime, Effect, Schema } from 'effect'

import { Composition, Patient } from '@assessmentis/clinical-domain'
import { CodeableConcept, Reference } from '@assessmentis/clinical-domain/data-types'
import type { Resource } from '@assessmentis/effectful-store'

const fields = {
  patientUrl: Schema.optional(Patient.UrlSchema),
  title: Schema.String,
} as const satisfies Schema.Struct.Fields

export class CompositionFormData extends Schema.Class<CompositionFormData>('CompositionFormData')(
  fields
) {
  static readonly defaultFormValues: typeof CompositionFormData.Encoded = {
    patientUrl: undefined,
    title: '',
  }

  static fromResource(composition: Composition): typeof CompositionFormData.Encoded {
    return {
      patientUrl: composition.subject?.reference,
      title: composition.title ?? '',
    }
  }

  private toConstructorArgs(
    existingDate?: DateTime.Utc
  ): ConstructorParameters<typeof Composition>[0] {
    let subject: Reference | undefined
    if (this.patientUrl) {
      subject = Reference.make({ reference: this.patientUrl.toString() })
    }
    return {
      author: [Reference.make({ display: 'Anonymous' })],
      date: existingDate ?? Effect.runSync(DateTime.now),
      section: [],
      status: 'preliminary',
      subject,
      title: this.title || 'New Composition',
      type: CodeableConcept.make({ coding: [] }),
    }
  }

  private toResource(existingDate?: DateTime.Utc): Composition {
    return Composition.make(this.toConstructorArgs(existingDate))
  }

  toCreatePayload(): Composition {
    return this.toResource()
  }

  toUpdatePayload(
    base: Resource.WithResourceUrl<Composition>
  ): Resource.WithResourceUrl<Composition> {
    return base.cloneWith({ ...this.toConstructorArgs(base.date), url: base.url })
  }
}
