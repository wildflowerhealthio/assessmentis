import { DateTime, Effect, Schema } from 'effect'

import { Composition, Patient } from '@assessmentis/clinical-domain'
import {
  CodeableConcept,
  Reference,
} from '@assessmentis/clinical-domain/data-types'
import type { Resource } from '@assessmentis/effectful-store'

const fields = {
  title: Schema.String,
  patientUrl: Schema.optional(Patient.UrlSchema),
} as const satisfies Schema.Struct.Fields

export class CompositionFormData extends Schema.Class<CompositionFormData>(
  'CompositionFormData'
)(fields) {
  static readonly defaultFormValues: typeof CompositionFormData.Encoded = {
    title: '',
    patientUrl: undefined,
  }

  static fromResource(
    composition: Composition
  ): typeof CompositionFormData.Encoded {
    return {
      title: composition.title ?? '',
      patientUrl: composition.subject?.reference,
    }
  }

  private toResource(existingDate?: DateTime.Utc): Composition {
    return Composition.make({
      title: this.title || 'New Composition',
      status: 'preliminary',
      type: CodeableConcept.make({ coding: [] }),
      subject: this.patientUrl
        ? Reference.make({ reference: this.patientUrl.toString() })
        : undefined,
      author: [Reference.make({ display: 'Anonymous' })],
      date: existingDate ?? Effect.runSync(DateTime.now),
      section: [],
    })
  }

  toCreatePayload(): Composition {
    return this.toResource()
  }

  toUpdatePayload(
    base: Resource.WithResourceUrl<Composition>
  ): Resource.WithResourceUrl<Composition> {
    return {
      ...base,
      ...this.toResource(base.date),
      url: base.url,
    }
  }
}
