import { Reference } from './complex/IdentifierAndReference'

export const referenceFromResource = (
  resource: { id: string; resourceType: string },
  display: string | undefined = undefined
) =>
  Reference.make({
    reference: `${resource.resourceType}/${resource.id}`,
    display,
  })
