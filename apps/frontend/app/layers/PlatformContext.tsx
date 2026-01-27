import { createContext, useContext } from 'react'
import {
  AuthDataService,
  OrgService,
  UserService,
} from '@assessmentis/platform-domain'
import { FhirR4ClientService } from './FhirR4ClientService'
import { ClinicalDataRepositoryService } from './ClinicalDataRepositoriesService'
import { VideoCallClientService } from './VideoCallClientService'

export interface PlatformContext {
  authDataService: typeof AuthDataService.Service
  orgService: typeof OrgService.Service
  userService: typeof UserService.Service
  fhirR4ClientService: typeof FhirR4ClientService.Service
  clinicalDataRepositoryService: typeof ClinicalDataRepositoryService.Service
  VideoCallClientService: typeof VideoCallClientService.Service
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PlatformContext = createContext<PlatformContext>(null as any)

export const usePlatformContext = () => useContext(PlatformContext)
