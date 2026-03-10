/**
 * Converts a tuple of types into their intersection.
 *
 * Uses the contravariance of function parameter types to distribute the
 * tuple elements into an intersection, then simplifies the result with a
 * mapped type so that hover information shows a flat object rather than
 * a chain of `&` intersections.
 *
 * @typeParam Base - A base constraint that every element of `T` must extend.
 * @typeParam T - A readonly tuple whose element types will be intersected.
 *
 * @example
 * ```ts
 * type Result = TupleToIntersection<object, [{ a: string }, { b: number }]>
 * // Result = { a: string; b: number }
 * ```
 */
export type TupleToIntersection<Base, T extends ReadonlyArray<Base>> = {
  [K in keyof T]: (x: T[K]) => void
} extends {
  [K: number]: (x: infer I) => void
}
  ? I extends Base
    ? { [K in keyof I]: I[K] } & {}
    : never
  : never
