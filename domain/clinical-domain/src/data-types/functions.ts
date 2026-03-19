import { Predicate, Schema } from 'effect'

import type { Resource as EffectResource, ReadonlyUrl } from '@assessmentis/effectful-store'

import { Reference } from './complex/identifier-and-reference'

/**
 * Creates a {@link Reference} pointing to a resource, or `undefined` if the
 * resource has no URL.
 *
 * @param resource - Any object with an optional `url` and a `domainType`
 * @param display - Optional display text for the reference
 *
 * @deprecated Prefer {@link Reference.fromResource} which also sets `type`.
 */
export const referenceFromResource = (
  resource: { url?: string | undefined; domainType: string },
  display?: string
): Reference | undefined => {
  if (resource && resource.url) {
    return new Reference({ display, reference: resource.url })
  }
  return undefined
}

/**
 * Extract the ID from a FHIR reference string
 * @param reference - Object with reference property (e.g., \{ reference: "Patient/123" \})
 * @returns The ID portion of the reference (e.g., "123"), or undefined
 */
export function extractReferenceId(
  reference: { reference?: string } | undefined
): string | undefined {
  return reference?.reference?.split('/')[1]
}

/**
 * Extract IDs from an array of FHIR references
 * @param references - Array of reference objects
 * @returns Array of extracted IDs (non-null values only)
 */
export function extractReferenceIds(
  references: readonly { reference?: string }[] | undefined
): string[] {
  return (
    references?.map((r) => r.reference?.split('/')[1]).filter((s) => Predicate.isNotNullable(s)) ??
    []
  )
}

/**
 * Extends a resource schema so that `url` is required instead of optional.
 *
 * @typeParam A - Decoded type (must have an optional `url`)
 * @typeParam I - Encoded type
 * @typeParam R - Schema context
 * @typeParam AUrl - Decoded URL brand
 * @typeParam IUrl - Encoded URL brand
 * @param schema - The base resource schema
 * @param urlSchema - Schema for the branded URL type
 * @returns A new schema where `url` is mandatory
 */
export const SchemaWithMandatoryUrl = <
  A extends { url?: AUrl | undefined },
  I extends { url?: IUrl | undefined },
  R,
  AUrl extends ReadonlyUrl,
  IUrl extends ReadonlyUrl,
>(
  schema: Schema.Schema<A, I, R>,
  urlSchema: Schema.Schema<AUrl, IUrl, R>
): Schema.Schema<EffectResource.WithResourceUrl<A>, EffectResource.WithResourceUrl<I>, R> => {
  const withMandatoryUrl: Schema.Schema<{ url: AUrl }, { url: IUrl }, R> = Schema.Struct({
    url: urlSchema,
  })
  return Schema.extend(schema, withMandatoryUrl)
}
