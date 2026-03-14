import * as ClinicalDomain from '@assessmentis/clinical-domain'

import '../../Labeled/implementations/Questionnaire'

import type { BreadcrumbLabelInstance } from '../BreadcrumbLabel'

declare module '@assessmentis/clinical-domain' {
  interface Questionnaire extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace Questionnaire {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.Questionnaire, 'BreadcrumbLabel', {
  value: ClinicalDomain.Questionnaire.Labeled.pluralLabel,
  configurable: true,
})

Object.defineProperty(
  ClinicalDomain.Questionnaire.prototype,
  'BreadcrumbLabel',
  {
    get(this: ClinicalDomain.Questionnaire): string {
      return this.name?.toString() ?? 'Unnamed Questionnaire'
    },
    configurable: true,
  }
)
