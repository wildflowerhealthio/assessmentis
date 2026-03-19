import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { formatHumanName } from '../../../modules/common/utils/fhir-display'
import type { ListableInstance, ListableProps } from '../listable'

declare module '@assessmentis/clinical-domain' {
  interface Patient extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.Patient.prototype, 'Listable', {
  configurable: true,
  get(this: ClinicalDomain.Patient): ListableProps {
    return {
      displayName: formatHumanName(this.name?.[0], 'Unnamed Patient'),
      summaryItems: [
        this.gender ?? '-',
        // oxlint-disable-next-line eslint/no-ternary -- inline template expression
        `Born: ${this.birthDate ? new Date(this.birthDate).toLocaleDateString() : 'Unknown'}`,
        // oxlint-disable-next-line eslint/no-ternary -- spread conditional in array literal
        ...(this.active === false ? ['Inactive'] : []),
      ],
    }
  },
})
