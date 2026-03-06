import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { BreadcrumbLabelInstance } from '../BreadcrumbLabel'

declare module '@assessmentis/clinical-domain' {
  interface Composition extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace Composition {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.Composition, 'BreadcrumbLabel', {
  value: 'Compositions',
  configurable: true,
})

Object.defineProperty(ClinicalDomain.Composition.prototype, 'BreadcrumbLabel', {
  get(this: ClinicalDomain.Composition): string {
    return this.title || this.type.text || 'Untitled Composition'
  },
  configurable: true,
})
