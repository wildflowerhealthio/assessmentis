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

  private toResource(): Composition {
    return Composition.make({
      title: this.title || 'New Composition',
      status: 'preliminary',
      type: CodeableConcept.make({ coding: [] }),
      subject: this.patientUrl
        ? Reference.make({ reference: this.patientUrl.toString() })
        : undefined,
      author: [Reference.make({ display: 'Anonymous' })],
      date: Effect.runSync(DateTime.now),
      section: [],
    })
  }

  toCreatePayload(): Composition {
    return this.toResource()
  }

  toUpdatePayload(base: Composition): Resource.WithResourceUrl<Composition> {
    if (!base.url) throw new Error('Cannot update resource without url')
    return { ...base, ...this.toResource(), url: base.url }
  }
}
