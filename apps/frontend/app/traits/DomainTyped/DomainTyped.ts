/**
 * Instance-level DomainTyped trait — each instance carries its FHIR resource type string.
 *
 * @typeParam T - String literal identifying the resource type (e.g. `"Patient"`)
 */
export interface DomainTypedInstance<out T extends string> {
  readonly domainType: T
}

/**
 * Constructor-level DomainTyped constraint — the class exposes a static `DomainType` discriminator.
 *
 * @typeParam T - String literal identifying the resource type (e.g. `"Patient"`)
 */
export interface DomainTypedConstructor<out T extends string> {
  DomainType: T
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): DomainTypedInstance<T>
}
