import type { ReadonlyUrl } from '@assessmentis/effectful-store'

import type { DomainTypedConstructor, DomainTypedInstance } from '../DomainTyped/domain-typed'

export function applyDefaultLinkTraitImplementation(
  klass: DomainTypedConstructor<string> & { prototype: object }
): void {
  Object.defineProperty(klass, 'Link', {
    configurable: true,
    value: `/${klass.DomainType}`,
  })

  Object.defineProperty(klass.prototype, 'Link', {
    configurable: true,
    get(this: DomainTypedInstance<string> & { url?: ReadonlyUrl }): string {
      const urlPart = this.url?.asUriComponent()
      if (urlPart) {
        return `/${this.domainType}/${urlPart}`
      }
      return `/${this.domainType}`
    },
  })
}
