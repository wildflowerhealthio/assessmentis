import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { formatHumanName } from '../../../modules/common/utils/fhirDisplay'
import type { ListableInstance, ListableProps } from '../Listable'

declare module '@assessmentis/clinical-domain' {
  interface Patient extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.Patient.prototype, 'Listable', {
  get(this: ClinicalDomain.Patient): ListableProps {
    return {
      displayName: formatHumanName(this.name?.[0], 'Unnamed Patient'),
      summaryItems: [
        this.gender ?? '-',
        `Born: ${this.birthDate ? new Date(this.birthDate).toLocaleDateString() : 'Unknown'}`,
        ...(this.active === false ? ['Inactive'] : []),
      ],
    }
  },
  configurable: true,
})
