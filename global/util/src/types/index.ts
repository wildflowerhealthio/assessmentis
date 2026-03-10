export * from './DeepReadonly'
export * from './DeepWriteable'
export * from './NotEmpty'
export * from './Simplify'
export * from './TupleToIntersection'
export * from './tuples'

/**
 * Make all properties in T optional
 */
export type ReadonlyPartial<out T> = {
  readonly [P in keyof T]?: T[P]
}

export type OmitPossiblyUndefined<in out T> = {
  readonly [K in keyof T as undefined extends T[K] ? never : K]: T[K]
}
