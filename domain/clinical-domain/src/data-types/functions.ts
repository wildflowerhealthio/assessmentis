import { Schema } from 'effect'

import type {
  Resource as EffectResource,
  ReadonlyUrl,
} from '@assessmentis/effectful-store'

import { Reference } from './complex/IdentifierAndReference'

export const referenceFromResource = (
  resource: { url?: string | undefined; domainType: string },
  display: string | undefined = undefined
) =>
  resource && resource.url
    ? new Reference({ reference: resource.url, display })
    : undefined

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
  references: ReadonlyArray<{ reference?: string }> | undefined
): string[] {
  return (
    references
      ?.map((r) => r.reference?.split('/')[1])
      .filter((id): id is string => !!id) ?? []
  )
}

export const SchemaWithMandatoryUrl = <
  A extends { url?: AUrl | undefined },
  I extends { url?: IUrl | undefined },
  R,
  AUrl extends ReadonlyUrl,
  IUrl extends ReadonlyUrl,
>(
  schema: Schema.Schema<A, I, R>,
  urlSchema: Schema.Schema<AUrl, IUrl, R>
): Schema.Schema<
  EffectResource.WithResourceUrl<A>,
  EffectResource.WithResourceUrl<I>,
  R
> => {
  const withMandatoryUrl: Schema.Schema<{ url: AUrl }, { url: IUrl }, R> =
    Schema.Struct({
      url: urlSchema,
    })
  return Schema.extend(schema, withMandatoryUrl)
}
