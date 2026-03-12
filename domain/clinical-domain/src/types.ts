import type { Reference } from './data-types/complex/IdentifierAndReference'

/**
 * Filter type for search operations on clinical data resources.
 * Allows filtering by resource properties, converting Reference types to strings.
 * Reference fields also accept `readonly string[]` for FHIR OR-style searching.
 *
 * @deprecated no longer used
 */
export type RepositoryFilters<TResource> = {
  [key in Exclude<
    keyof TResource,
    'resourceType'
  >]?: Reference extends TResource[key]
    ? undefined | string | readonly string[]
    : TResource[key] extends string
      ? undefined | string | readonly string[]
      : never
}
