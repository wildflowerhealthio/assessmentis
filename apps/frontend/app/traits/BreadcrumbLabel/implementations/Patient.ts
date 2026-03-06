import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { formatHumanName } from '../../../modules/common/utils/fhirDisplay'
import type { BreadcrumbLabelInstance } from '../BreadcrumbLabel'

declare module '@assessmentis/clinical-domain' {
  interface Patient extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace Patient {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.Patient, 'BreadcrumbLabel', {
  value: 'Patients',
  configurable: true,
})

Object.defineProperty(ClinicalDomain.Patient.prototype, 'BreadcrumbLabel', {
  get(this: ClinicalDomain.Patient): string {
    return formatHumanName(this.name?.[0], 'Unnamed Patient')
  },
  configurable: true,
})
