import { createContext, useContext } from 'react'

import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'
import type { Hub } from '@assessmentis/effectful-store'
import type { AuthDataService, OrgService, UserService } from '@assessmentis/platform-domain'

export interface PlatformContext {
  authDataService: typeof AuthDataService.Service
  orgService: typeof OrgService.Service
  userService: typeof UserService.Service
  hub: Hub.Hub<ClinicalDomainClasses>
}

// Allow the asserted null because a value will always exist in practice
// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const PlatformContext = createContext<PlatformContext>(null as unknown as PlatformContext)

export const usePlatformContext = (): PlatformContext => useContext(PlatformContext)
