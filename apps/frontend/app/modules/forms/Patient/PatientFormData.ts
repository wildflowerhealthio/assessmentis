import { Schema } from 'effect'

import { Patient, Practitioner } from '@assessmentis/clinical-domain'
import {
  AdministrativeGender,
  HumanName,
  Reference,
} from '@assessmentis/clinical-domain/data-types'
import type { Resource } from '@assessmentis/effectful-store'

const fields = {
  givenName: Schema.String,
  familyName: Schema.String,
  gender: Schema.optional(AdministrativeGender),
  birthDate: Schema.optional(Schema.DateFromSelf),
  practitionerUrl: Schema.optional(Practitioner.UrlSchema),
} as const satisfies Schema.Struct.Fields

export class PatientFormData extends Schema.Class<PatientFormData>(
  'PatientFormData'
)(fields) {
  static readonly defaultFormValues: typeof PatientFormData.Encoded = {
    givenName: '',
    familyName: '',
    gender: undefined,
    birthDate: undefined,
    practitionerUrl: undefined,
  }

  static fromResource(patient: Patient): typeof PatientFormData.Encoded {
    return {
      givenName: patient.name?.[0]?.given?.[0] ?? '',
      familyName: patient.name?.[0]?.family ?? '',
      gender: patient.gender,
      birthDate: patient.birthDate,
      practitionerUrl: patient.generalPractitioner?.[0]?.reference,
    }
  }

  private toResource(): Patient {
    const givenName = this.givenName?.trim()
    const familyName = this.familyName?.trim()

    return Patient.make({
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
      birthDate: this.birthDate ? this.birthDate : undefined,
      generalPractitioner: this.practitionerUrl
        ? [
            Reference.make({
              reference: this.practitionerUrl.toString(),
            }),
          ]
        : undefined,
      active: true,
    })
  }

  toCreatePayload(): Patient {
    return this.toResource()
  }

  toUpdatePayload(base: Patient): Resource.WithResourceUrl<Patient> {
    if (!base.url) throw new Error('Cannot update resource without url')
    return { ...base, ...this.toResource(), url: base.url }
  }
}
