import { createContext, useContext } from 'react'
import { Org } from '@assessmentis/platform-domain'

export const OrgContext = createContext<Org>(null as unknown as Org)

export const useOrg = () => useContext(OrgContext)
