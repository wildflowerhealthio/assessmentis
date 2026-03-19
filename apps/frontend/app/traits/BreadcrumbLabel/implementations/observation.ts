import * as ClinicalDomain from '@assessmentis/clinical-domain'

import '../../Labeled/implementations/observation'

import type { BreadcrumbLabelInstance } from '../breadcrumb-label'

declare module '@assessmentis/clinical-domain' {
  interface Observation extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace Observation {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.Observation, 'BreadcrumbLabel', {
  configurable: true,
  value: ClinicalDomain.Observation.Labeled.pluralLabel,
})

Object.defineProperty(ClinicalDomain.Observation.prototype, 'BreadcrumbLabel', {
  configurable: true,
  get(this: ClinicalDomain.Observation): string {
    return this.code.text ?? this.code.coding?.[0]?.display ?? 'Unknown Observation'
  },
})
