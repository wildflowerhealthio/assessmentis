import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { ListableInstance, ListableProps } from '../Listable'

declare module '@assessmentis/clinical-domain' {
  interface QuestionnaireResponse extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(
  ClinicalDomain.QuestionnaireResponse.prototype,
  'Listable',
  {
    get(this: ClinicalDomain.QuestionnaireResponse): ListableProps {
      const lastUpdated = this.meta?.lastUpdated
        ? new Date(this.meta.lastUpdated.epochMillis).toLocaleDateString()
        : null

      return {
        displayName:
          this.questionnaire?.toString() ??
          this.url?.toString() ??
          'Unnamed Response',
        summaryItems: lastUpdated ? [`Updated: ${lastUpdated}`] : [],
      }
    },
    configurable: true,
  }
)
