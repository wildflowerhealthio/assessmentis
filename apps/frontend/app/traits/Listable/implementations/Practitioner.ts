import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { formatHumanName } from '../../../modules/common/utils/fhirDisplay'
import { getPractitionerQualification } from '../../../modules/resources/Practitioner/utils/practitionerDisplay'
import type { ListableInstance, ListableProps } from '../Listable'

declare module '@assessmentis/clinical-domain' {
  interface Practitioner extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.Practitioner.prototype, 'Listable', {
  get(this: ClinicalDomain.Practitioner): ListableProps {
    return {
      displayName: formatHumanName(this.name?.[0], 'Unnamed Practitioner'),
      summaryItems: [
        this.gender ?? 'Unknown',
        getPractitionerQualification(this),
        ...(this.active === false ? ['Inactive'] : []),
      ],
    }
  },
  configurable: true,
})
