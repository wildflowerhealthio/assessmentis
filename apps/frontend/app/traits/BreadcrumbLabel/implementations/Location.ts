import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { BreadcrumbLabelInstance } from '../BreadcrumbLabel'

declare module '@assessmentis/clinical-domain' {
  interface Location extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace Location {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.Location, 'BreadcrumbLabel', {
  value: 'Locations',
  configurable: true,
})

Object.defineProperty(ClinicalDomain.Location.prototype, 'BreadcrumbLabel', {
  get(this: ClinicalDomain.Location): string {
    const name = this.name?.trim()
    if (name) return name

    const identifierValue = this.identifier?.[0]?.value?.trim()
    if (identifierValue) return identifierValue

    return `Location ${this.url?.toString() ?? 'Unknown'}`
  },
  configurable: true,
})
