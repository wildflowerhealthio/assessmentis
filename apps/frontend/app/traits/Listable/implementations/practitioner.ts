import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { formatHumanName } from '../../../modules/common/utils/fhir-display'
import { getPractitionerQualification } from '../../../modules/resources/Practitioner/utils/practitioner-display'
import type { ListableInstance, ListableProps } from '../listable'

declare module '@assessmentis/clinical-domain' {
  interface Practitioner extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.Practitioner.prototype, 'Listable', {
  configurable: true,
  get(this: ClinicalDomain.Practitioner): ListableProps {
    return {
      displayName: formatHumanName(this.name?.[0], 'Unnamed Practitioner'),
      summaryItems: [
        this.gender ?? 'Unknown',
        getPractitionerQualification(this),
        // oxlint-disable-next-line eslint/no-ternary -- spread conditional in array literal
        ...(this.active === false ? ['Inactive'] : []),
      ],
    }
  },
})
