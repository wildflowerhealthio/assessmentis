import type { ReadonlyUrl } from '@assessmentis/effectful-store'

import type {
  DomainTypedConstructor,
  DomainTypedInstance,
} from '../DomainTyped/DomainTyped'

export function applyDefaultLinkTraitImplementation(
  klass: DomainTypedConstructor<string> & { prototype: object }
): void {
  Object.defineProperty(klass, 'Link', {
    value: `/${klass.DomainType}`,
    configurable: true,
  })

  Object.defineProperty(klass.prototype, 'Link', {
    get(this: DomainTypedInstance<string> & { url?: ReadonlyUrl }): string {
      return `/${this.domainType}/${this.url?.asUriComponent() ?? ''}`
    },
    configurable: true,
  })
}
