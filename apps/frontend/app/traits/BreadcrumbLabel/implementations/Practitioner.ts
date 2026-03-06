import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { formatHumanName } from '../../../modules/common/utils/fhirDisplay'
import type { BreadcrumbLabelInstance } from '../BreadcrumbLabel'

declare module '@assessmentis/clinical-domain' {
  interface Practitioner extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace Practitioner {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.Practitioner, 'BreadcrumbLabel', {
  value: 'Practitioners',
  configurable: true,
})

Object.defineProperty(
  ClinicalDomain.Practitioner.prototype,
  'BreadcrumbLabel',
  {
    get(this: ClinicalDomain.Practitioner): string {
      return formatHumanName(this.name?.[0], 'Unnamed Practitioner')
    },
    configurable: true,
  }
)
