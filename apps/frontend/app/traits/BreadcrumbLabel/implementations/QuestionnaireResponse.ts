import * as ClinicalDomain from '@assessmentis/clinical-domain'

import '../../Labeled/implementations/QuestionnaireResponse'

import type { BreadcrumbLabelInstance } from '../BreadcrumbLabel'

declare module '@assessmentis/clinical-domain' {
  interface QuestionnaireResponse extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace QuestionnaireResponse {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.QuestionnaireResponse, 'BreadcrumbLabel', {
  value: ClinicalDomain.QuestionnaireResponse.Labeled.pluralLabel,
  configurable: true,
})

Object.defineProperty(
  ClinicalDomain.QuestionnaireResponse.prototype,
  'BreadcrumbLabel',
  {
    get(this: ClinicalDomain.QuestionnaireResponse): string {
      return `Response ${this.url?.toString() ?? 'Unknown'}`
    },
    configurable: true,
  }
)
