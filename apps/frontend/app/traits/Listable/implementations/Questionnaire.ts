import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { ListableInstance, ListableProps } from '../Listable'

declare module '@assessmentis/clinical-domain' {
  interface Questionnaire extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.Questionnaire.prototype, 'Listable', {
  get(this: ClinicalDomain.Questionnaire): ListableProps {
    return {
      displayName:
        this.title ?? this.url?.toString() ?? 'Unnamed Questionnaire',
      summaryItems: [`Status: ${this.status ?? 'unknown'}`],
    }
  },
  configurable: true,
})
