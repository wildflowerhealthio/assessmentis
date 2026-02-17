import type { ReadonlyRecord } from 'effect/Record'

export type SearchParamValue =
  | number
  | ReadonlyArray<number>
  | string
  | readonly string[]
  | undefined

/**
 * Flattens search params by joining array values with commas (FHIR OR semantics)
 * and filtering out undefined values and empty arrays.
 */
export const flattenSearchParams = (
  params: ReadonlyRecord<string, SearchParamValue>
): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    if (typeof value === 'string') {
      result[key] = value
    } else if (typeof value === 'number') {
      result[key] = value.toString()
    } else if (value.length > 0) {
      result[key] = value.join(',')
    }
  }
  return result
}

/**
 * Builds URLSearchParams from a record, filtering out undefined values.
 * Array values are joined with commas for FHIR OR semantics.
 * @param params - Record of search parameters
 * @returns URLSearchParams instance with only defined values
 */
export const buildSearchParams = (
  params: Record<string, SearchParamValue>
): URLSearchParams => {
  return new URLSearchParams(Object.entries(flattenSearchParams(params)))
}
