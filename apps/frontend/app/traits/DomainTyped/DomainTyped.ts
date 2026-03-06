export interface DomainTypedInstance<out T extends string> {
  readonly domainType: T
}

export interface DomainTypedConstructor<out T extends string> {
  DomainType: T
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): DomainTypedInstance<T>
}
