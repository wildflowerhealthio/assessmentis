import { Reference } from './complex/IdentifierAndReference'

export const referenceFromResource = (
  resource: { id?: string | undefined; resourceType: string },
  display: string | undefined = undefined
) =>
  resource && resource.id
    ? Reference.make({
        reference: `${resource.resourceType}/${resource.id}`,
        display,
      })
    : undefined

export const referenceAsString = (
  reference:
    | Reference
    | { id?: string | undefined; resourceType: string }
    | undefined
): string | undefined => {
  if (!reference) return undefined

  if ('reference' in reference && typeof reference.reference === 'string') {
    return reference.reference
  }

  if ('id' in reference && 'resourceType' in reference) {
    return `${reference.resourceType}/${reference.id}`
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
  references: ReadonlyArray<{ reference?: string }> | undefined
): string[] {
  return (
    references
      ?.map((r) => r.reference?.split('/')[1])
      .filter((id): id is string => !!id) ?? []
  )
}
