import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'
import type { Hub } from '@assessmentis/effectful-store'

import { usePlatformContext } from './platform-context'

export const useHub = (): Hub.Hub<ClinicalDomainClasses> => usePlatformContext().hub
