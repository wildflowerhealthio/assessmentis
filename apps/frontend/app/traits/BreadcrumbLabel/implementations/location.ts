import * as ClinicalDomain from '@assessmentis/clinical-domain'

import '../../Labeled/implementations/location'

import type { BreadcrumbLabelInstance } from '../breadcrumb-label'

declare module '@assessmentis/clinical-domain' {
  interface Location extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace Location {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.Location, 'BreadcrumbLabel', {
  configurable: true,
  value: ClinicalDomain.Location.Labeled.pluralLabel,
})

Object.defineProperty(ClinicalDomain.Location.prototype, 'BreadcrumbLabel', {
  configurable: true,
  get(this: ClinicalDomain.Location): string {
    const name = this.name?.trim()
    if (name) {
      return name
    }

    const identifierValue = this.identifier?.[0]?.value?.trim()
    if (identifierValue) {
      return identifierValue
    }

    return `Location ${this.url?.toString() ?? 'Unknown'}`
  },
})
