import type { ResourceDataTypes } from '@assessmentis/clinical-domain'
import type { Hub } from '@assessmentis/effectful-store'

import { usePlatformContext } from './PlatformContext'

export const useHub = (): Hub.Hub<ResourceDataTypes> => usePlatformContext().hub
