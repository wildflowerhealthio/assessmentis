import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { BreadcrumbLabelInstance } from '../BreadcrumbLabel'

declare module '@assessmentis/clinical-domain' {
  interface Observation extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace Observation {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.Observation, 'BreadcrumbLabel', {
  value: 'Observations',
  configurable: true,
})

Object.defineProperty(ClinicalDomain.Observation.prototype, 'BreadcrumbLabel', {
  get(this: ClinicalDomain.Observation): string {
    return (
      this.code.text ?? this.code.coding?.[0]?.display ?? 'Unknown Observation'
    )
  },
  configurable: true,
})
