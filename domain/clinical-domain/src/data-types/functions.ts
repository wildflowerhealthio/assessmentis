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
