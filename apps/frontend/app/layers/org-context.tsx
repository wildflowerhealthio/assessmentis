import { createContext, useContext } from 'react'

import type { Org } from '@assessmentis/platform-domain'

// This will always have a value in practice, or will fail fast
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
export const OrgContext = createContext<Org>(null as unknown as Org)

export const useOrg = (): Org => useContext(OrgContext)
