export interface BreadcrumbLabelInstance {
  readonly BreadcrumbLabel: string
}

export interface BreadcrumbLabelConstructor {
  BreadcrumbLabel: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): BreadcrumbLabelInstance
}

/** @deprecated Use BreadcrumbLabelConstructor instead. */
export type BreadcrumbLabelClass = BreadcrumbLabelConstructor

/**
 * Narrows a resource to include BreadcrumbLabel.
 *
 * Needed because ResourceDataTypes[K] for generic K is a union over all
 * resource types, and TypeScript can't see that the class constraint
 * (BreadcrumbLabelConstructor) guarantees instances have this property.
 */
export function assertBreadcrumbLabel<T>(
  resource: T
): asserts resource is T & BreadcrumbLabelInstance {
  if (
    !resource ||
    typeof resource !== 'object' ||
    !('BreadcrumbLabel' in resource)
  ) {
    throw new Error(
      'Resource missing BreadcrumbLabel trait — did you import the implementation?'
    )
  }
}
