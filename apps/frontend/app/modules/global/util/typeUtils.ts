import { ReadonlyTag } from 'effect/Context'

/**
 * Extract the service type from a ReadonlyTag
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractService<T> = T extends ReadonlyTag<any, infer S> ? S : never

/**
 * Extract the Tag type from a ReadonlyTag
 * For Context.Tag, the first parameter is the tag type itself
 */
export type ExtractTag<T> =
  T extends ReadonlyTag<
    infer TTag,
    any // eslint-disable-line @typescript-eslint/no-explicit-any
  >
    ? TTag
    : never
