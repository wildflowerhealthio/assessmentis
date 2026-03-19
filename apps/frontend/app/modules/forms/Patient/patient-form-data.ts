import { Schema } from 'effect'

import { Patient, Practitioner } from '@assessmentis/clinical-domain'
import {
  AdministrativeGender,
  HumanName,
  Reference,
} from '@assessmentis/clinical-domain/data-types'
import type { Resource } from '@assessmentis/effectful-store'

const fields = {
  birthDate: Schema.optional(Schema.DateFromSelf),
  familyName: Schema.String,
  gender: Schema.optional(AdministrativeGender),
  givenName: Schema.String,
  practitionerUrl: Schema.optional(Practitioner.UrlSchema),
} as const satisfies Schema.Struct.Fields

export class PatientFormData extends Schema.Class<PatientFormData>('PatientFormData')(fields) {
  static readonly defaultFormValues: typeof PatientFormData.Encoded = {
    birthDate: undefined,
    familyName: '',
    gender: undefined,
    givenName: '',
    practitionerUrl: undefined,
  }

  static fromResource(patient: Patient): typeof PatientFormData.Encoded {
    return {
      birthDate: patient.birthDate,
      familyName: patient.name?.[0]?.family ?? '',
      gender: patient.gender,
      givenName: patient.name?.[0]?.given?.[0] ?? '',
      practitionerUrl: patient.generalPractitioner?.[0]?.reference,
    }
  }

  private toConstructorArgs(): ConstructorParameters<typeof Patient>[0] {
    const givenName = this.givenName?.trim()
    const familyName = this.familyName?.trim()

    let generalPractitioner: Reference[] | undefined
    if (this.practitionerUrl) {
      generalPractitioner = [
        Reference.make({
          reference: this.practitionerUrl.toString(),
        }),
      ]
    }

    let name: ReturnType<typeof HumanName.make>[] | undefined
    if (givenName || familyName) {
      let given: string[] | undefined
      if (givenName) {
        given = [givenName]
      }
      name = [
        HumanName.make({
          given,
          family: familyName || undefined,
        }),
      ]
    }

    return {
      active: true,
      birthDate: this.birthDate ?? undefined,
      gender: this.gender,
      generalPractitioner,
      name,
    }
  }

  private toResource(): Patient {
    return Patient.make(this.toConstructorArgs())
  }

  toCreatePayload(): Patient {
    return this.toResource()
  }

  toUpdatePayload(base: Resource.WithResourceUrl<Patient>): Resource.WithResourceUrl<Patient> {
    return base.cloneWith({ ...this.toConstructorArgs(), url: base.url })
  }
}
