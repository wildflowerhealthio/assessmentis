import { createContext, useContext } from 'react'

import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'
import type { Hub } from '@assessmentis/effectful-store'
import type {
  AuthDataService,
  OrgService,
  UserService,
} from '@assessmentis/platform-domain'

export interface PlatformContext {
  authDataService: typeof AuthDataService.Service
  orgService: typeof OrgService.Service
  userService: typeof UserService.Service
  hub: Hub.Hub<ClinicalDomainClasses>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PlatformContext = createContext<PlatformContext>(null as any)

export const usePlatformContext = () => useContext(PlatformContext)
