import { Schema } from 'effect'

import {
  Practitioner,
  PractitionerQualification,
} from '@assessmentis/clinical-domain'
import {
  AdministrativeGender,
  CodeableConcept,
  HumanName,
} from '@assessmentis/clinical-domain/data-types'
import type { Resource } from '@assessmentis/effectful-store'

const fields = {
  givenName: Schema.String,
  familyName: Schema.String,
  gender: Schema.optional(AdministrativeGender),
  qualification: Schema.optional(Schema.String),
} as const satisfies Schema.Struct.Fields

export class PractitionerFormData extends Schema.Class<PractitionerFormData>(
  'PractitionerFormData'
)(fields) {
  static readonly defaultFormValues: typeof PractitionerFormData.Encoded = {
    givenName: '',
    familyName: '',
    gender: undefined,
    qualification: undefined,
  }

  static fromResource(
    practitioner: Practitioner
  ): typeof PractitionerFormData.Encoded {
    return {
      givenName: practitioner.name?.[0]?.given?.[0] ?? '',
      familyName: practitioner.name?.[0]?.family ?? '',
      gender: practitioner.gender ?? undefined,
      qualification: practitioner.qualification?.[0]?.code?.text ?? undefined,
    }
  }

  private toResource(): Practitioner {
    const givenName = this.givenName?.trim()
    const familyName = this.familyName?.trim()
    const qualification = this.qualification?.trim()

    return Practitioner.make({
      name:
        givenName || familyName
          ? [
              HumanName.make({
                given: givenName ? [givenName] : undefined,
                family: familyName || undefined,
              }),
            ]
          : undefined,
      gender: this.gender,
      qualification: qualification
        ? [
            PractitionerQualification.make({
              code: CodeableConcept.make({
                text: qualification,
                coding: [],
              }),
            }),
          ]
        : undefined,
      active: true,
    })
  }

  toCreatePayload(): Practitioner {
    return this.toResource()
  }

  toUpdatePayload(
    base: Resource.WithResourceUrl<Practitioner>
  ): Resource.WithResourceUrl<Practitioner> {
    return { ...base, ...this.toResource(), url: base.url }
  }
}
