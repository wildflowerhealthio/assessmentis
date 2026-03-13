export interface ListableProps {
  readonly displayName: string
  readonly summaryItems: readonly string[]
}

export interface ListableInstance {
  Listable: ListableProps
}

export interface ListableConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): ListableInstance
}

export function assertListable<T>(
  resource: T
): asserts resource is T & ListableInstance {
  if (!resource || typeof resource !== 'object' || !('Listable' in resource)) {
    throw new Error(
      'Resource missing Listable trait — did you import the implementation?'
    )
  }
}
