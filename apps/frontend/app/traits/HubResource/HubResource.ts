import type { ResourceDataTypes } from '@assessmentis/clinical-domain'

import type { DomainTypedConstructor } from '../DomainTyped/DomainTyped'

/**
 * Marker interface for classes whose DomainType is available on the
 * ClinicalDomainHub. Used as a type constraint by hooks and components
 * that need hub access (e.g. `useResourceCollection`, `ResourceListIndexPage`).
 *
 * Structurally identical to `DomainTypedClass<K>` with `K` narrowed to
 * `keyof ResourceDataTypes`. The module augmentations in `implementations/`
 * make each hub-available class explicitly satisfy this interface.
 */
export interface HubResourceConstructor<
  K extends keyof ResourceDataTypes & string = keyof ResourceDataTypes & string,
> extends DomainTypedConstructor<K> {}
