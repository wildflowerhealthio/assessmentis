export type TupleToIntersection<Base, T extends ReadonlyArray<Base>> = {
  [K in keyof T]: (x: T[K]) => void
} extends {
  [K: number]: (x: infer I) => void
}
  ? I extends Base
    ? { [K in keyof I]: I[K] } & {}
    : never
  : never
