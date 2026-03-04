export * from './DeepReadonly'
export * from './DeepWriteable'
export * from './NotEmpty'
export * from './TupleToIntersection'
export * from './tuples'

export type Simplfy<T> = { [K in keyof T]: T[K] } & {}

/**
 * Make all properties in T optional
 */
export type ReadonlyPartial<out T> = {
  readonly [P in keyof T]?: T[P]
}

export type OmitPossiblyUndefined<in out T> = {
  readonly [K in keyof T as undefined extends T[K] ? never : K]: T[K]
}
