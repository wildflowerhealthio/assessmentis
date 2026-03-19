import * as ClinicalDomain from '@assessmentis/clinical-domain'

import '../../Labeled/implementations/questionnaire'

import type { BreadcrumbLabelInstance } from '../breadcrumb-label'

declare module '@assessmentis/clinical-domain' {
  interface Questionnaire extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace Questionnaire {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.Questionnaire, 'BreadcrumbLabel', {
  configurable: true,
  value: ClinicalDomain.Questionnaire.Labeled.pluralLabel,
})

Object.defineProperty(ClinicalDomain.Questionnaire.prototype, 'BreadcrumbLabel', {
  configurable: true,
  get(this: ClinicalDomain.Questionnaire): string {
    return this.name?.toString() ?? 'Unnamed Questionnaire'
  },
})
