import * as ClinicalDomain from '@assessmentis/clinical-domain'

// eslint-disable-next-line import/no-unassigned-import -- Registers the Labeled trait that BreadcrumbLabel depends on
import '../../Labeled/implementations/composition'

import type { BreadcrumbLabelInstance } from '../breadcrumb-label'

declare module '@assessmentis/clinical-domain' {
  interface Composition extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace Composition {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.Composition, 'BreadcrumbLabel', {
  configurable: true,
  value: ClinicalDomain.Composition.Labeled.pluralLabel,
})

Object.defineProperty(ClinicalDomain.Composition.prototype, 'BreadcrumbLabel', {
  configurable: true,
  get(this: ClinicalDomain.Composition): string {
    return this.title || this.type.text || 'Untitled Composition'
  },
})
