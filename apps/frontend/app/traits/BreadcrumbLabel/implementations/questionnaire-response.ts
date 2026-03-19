import * as ClinicalDomain from '@assessmentis/clinical-domain'

// eslint-disable-next-line import/no-unassigned-import -- Registers the Labeled trait that BreadcrumbLabel depends on
import '../../Labeled/implementations/questionnaire-response'

import type { BreadcrumbLabelInstance } from '../breadcrumb-label'

declare module '@assessmentis/clinical-domain' {
  interface QuestionnaireResponse extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace QuestionnaireResponse {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.QuestionnaireResponse, 'BreadcrumbLabel', {
  configurable: true,
  value: ClinicalDomain.QuestionnaireResponse.Labeled.pluralLabel,
})

Object.defineProperty(ClinicalDomain.QuestionnaireResponse.prototype, 'BreadcrumbLabel', {
  configurable: true,
  get(this: ClinicalDomain.QuestionnaireResponse): string {
    return `Response ${this.url?.toString() ?? 'Unknown'}`
  },
})
