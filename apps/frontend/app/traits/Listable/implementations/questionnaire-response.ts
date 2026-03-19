import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { ListableInstance, ListableProps } from '../listable'

declare module '@assessmentis/clinical-domain' {
  interface QuestionnaireResponse extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.QuestionnaireResponse.prototype, 'Listable', {
  configurable: true,
  get(this: ClinicalDomain.QuestionnaireResponse): ListableProps {
    let lastUpdated: string | null = null
    if (this.meta?.lastUpdated) {
      lastUpdated = new Date(this.meta.lastUpdated.epochMillis).toLocaleDateString()
    }

    const summaryItems: string[] = []
    if (lastUpdated) {
      summaryItems.push(`Updated: ${lastUpdated}`)
    }

    return {
      displayName: this.questionnaire?.toString() ?? this.url?.toString() ?? 'Unnamed Response',
      summaryItems,
    }
  },
})
