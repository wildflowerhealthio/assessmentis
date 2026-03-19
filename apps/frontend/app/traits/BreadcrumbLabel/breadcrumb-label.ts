/** Instance-level BreadcrumbLabel trait — provides a human-readable label for breadcrumb navigation. */
export interface BreadcrumbLabelInstance {
  readonly BreadcrumbLabel: string
}

/**
 * Constructor-level BreadcrumbLabel constraint.
 *
 * @remarks
 * The static `BreadcrumbLabel` is the default collection-level label
 * (e.g. "Patients"), while instances compute a resource-specific label
 * (e.g. the patient's name).
 */
export interface BreadcrumbLabelConstructor {
  BreadcrumbLabel: string
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): BreadcrumbLabelInstance
}

/** @deprecated Use BreadcrumbLabelConstructor instead. */
export type BreadcrumbLabelClass = BreadcrumbLabelConstructor

/**
 * Narrows a resource to include BreadcrumbLabel.
 *
 * @param resource - The value to assert
 *
 * @remarks
 * Needed because `ResourceDataTypes[K]` for generic K is a union over all
 * resource types, and TypeScript can't see that the class constraint
 * ({@link BreadcrumbLabelConstructor}) guarantees instances have this property.
 */
export function assertBreadcrumbLabel<T>(
  resource: T
): asserts resource is T & BreadcrumbLabelInstance {
  if (!resource || typeof resource !== 'object' || !('BreadcrumbLabel' in resource)) {
    throw new Error('Resource missing BreadcrumbLabel trait — did you import the implementation?')
  }
}
