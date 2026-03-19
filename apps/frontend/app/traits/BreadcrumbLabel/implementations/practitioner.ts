import * as ClinicalDomain from '@assessmentis/clinical-domain'

// eslint-disable-next-line import/no-unassigned-import -- Registers the Labeled trait that BreadcrumbLabel depends on
import '../../Labeled/implementations/practitioner'

import { formatHumanName } from '../../../modules/common/utils/fhir-display'
import type { BreadcrumbLabelInstance } from '../breadcrumb-label'

declare module '@assessmentis/clinical-domain' {
  interface Practitioner extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace Practitioner {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.Practitioner, 'BreadcrumbLabel', {
  configurable: true,
  value: ClinicalDomain.Practitioner.Labeled.pluralLabel,
})

Object.defineProperty(ClinicalDomain.Practitioner.prototype, 'BreadcrumbLabel', {
  configurable: true,
  get(this: ClinicalDomain.Practitioner): string {
    return formatHumanName(this.name?.[0], 'Unnamed Practitioner')
  },
})
