import * as ClinicalDomain from '@assessmentis/clinical-domain'

// eslint-disable-next-line import/no-unassigned-import -- Registers the Labeled trait that BreadcrumbLabel depends on
import '../../Labeled/implementations/patient'

import { formatHumanName } from '../../../modules/common/utils/fhir-display'
import type { BreadcrumbLabelInstance } from '../breadcrumb-label'

declare module '@assessmentis/clinical-domain' {
  interface Patient extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace Patient {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.Patient, 'BreadcrumbLabel', {
  configurable: true,
  value: ClinicalDomain.Patient.Labeled.pluralLabel,
})

Object.defineProperty(ClinicalDomain.Patient.prototype, 'BreadcrumbLabel', {
  configurable: true,
  get(this: ClinicalDomain.Patient): string {
    return formatHumanName(this.name?.[0], 'Unnamed Patient')
  },
})
