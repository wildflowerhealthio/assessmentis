export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends number | string | symbol // Is it a primitive? Then make it readonly
    ? Readonly<T[K]>
    : T[K] extends Array<infer A>
      ? Readonly<Array<DeepReadonly<A>>>
      : DeepReadonly<T[K]>
}
