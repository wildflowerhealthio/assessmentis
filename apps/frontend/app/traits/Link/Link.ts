export interface LinkInstance {
  readonly Link: string
}

export interface LinkConstructor {
  Link: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): LinkInstance
}

export function assertLink<T>(
  resource: T
): asserts resource is T & LinkInstance {
  if (!resource || typeof resource !== 'object' || !('Link' in resource)) {
    throw new Error(
      'Resource missing Link trait — did you import the implementation?'
    )
  }
}
