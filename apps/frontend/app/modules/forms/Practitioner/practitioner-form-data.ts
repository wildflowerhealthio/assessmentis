import { Schema } from 'effect'

import { Practitioner, PractitionerQualification } from '@assessmentis/clinical-domain'
import {
  AdministrativeGender,
  CodeableConcept,
  HumanName,
} from '@assessmentis/clinical-domain/data-types'
import type { Resource } from '@assessmentis/effectful-store'

const fields = {
  familyName: Schema.String,
  gender: Schema.optional(AdministrativeGender),
  givenName: Schema.String,
  qualification: Schema.optional(Schema.String),
} as const satisfies Schema.Struct.Fields

export class PractitionerFormData extends Schema.Class<PractitionerFormData>(
  'PractitionerFormData'
)(fields) {
  static readonly defaultFormValues: typeof PractitionerFormData.Encoded = {
    familyName: '',
    gender: undefined,
    givenName: '',
    qualification: undefined,
  }

  static fromResource(practitioner: Practitioner): typeof PractitionerFormData.Encoded {
    return {
      familyName: practitioner.name?.[0]?.family ?? '',
      gender: practitioner.gender ?? undefined,
      givenName: practitioner.name?.[0]?.given?.[0] ?? '',
      qualification: practitioner.qualification?.[0]?.code?.text ?? undefined,
    }
  }

  private toConstructorArgs(): ConstructorParameters<typeof Practitioner>[0] {
    const givenName = this.givenName?.trim()
    const familyName = this.familyName?.trim()
    const qualification = this.qualification?.trim()

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

    let qualificationList: ReturnType<typeof PractitionerQualification.make>[] | undefined
    if (qualification) {
      qualificationList = [
        PractitionerQualification.make({
          code: CodeableConcept.make({
            text: qualification,
            coding: [],
          }),
        }),
      ]
    }

    return {
      active: true,
      gender: this.gender,
      name,
      qualification: qualificationList,
    }
  }

  private toResource(): Practitioner {
    return Practitioner.make(this.toConstructorArgs())
  }

  toCreatePayload(): Practitioner {
    return this.toResource()
  }

  toUpdatePayload(
    base: Resource.WithResourceUrl<Practitioner>
  ): Resource.WithResourceUrl<Practitioner> {
    return base.cloneWith({ ...this.toConstructorArgs(), url: base.url })
  }
}
