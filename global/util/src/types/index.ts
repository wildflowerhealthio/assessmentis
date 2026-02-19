export * from './DeepReadonly'
export * from './DeepWriteable'
export * from './NotEmpty'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TupleToIntersection<T extends any[]> = {
  [K in keyof T]: (x: T[K]) => void
} extends {
  [K: number]: (x: infer I) => void
}
  ? I
  : never

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
