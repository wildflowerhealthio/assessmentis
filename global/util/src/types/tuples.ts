/**
 * Type-level filter for tuples. Keeps only elements that extend `Test`,
 * preserving order and narrowing the tuple type accordingly.
 */
export type TupleFilter<
  Arr extends ReadonlyArray<unknown>,
  Test,
> = Arr extends readonly [infer Head, ...infer Rest]
  ? Rest extends ReadonlyArray<unknown>
    ? Head extends Test
      ? [Head, ...TupleFilter<Rest, Test>]
      : TupleFilter<Rest, Test>
    : []
  : []

/** Runtime counterpart of {@link TupleFilter}. Filters an array with a type-guard predicate. */
export const tupleFilter = <Arr extends ReadonlyArray<unknown>, Test>(
  arr: Arr,
  predicate: (item: unknown) => item is Test
) => arr.filter((x): x is Test => predicate(x)) as TupleFilter<Arr, Test>

/**
 * Maps a tuple of keys through a record, producing a tuple of the
 * corresponding values in the same order.
 */
export type TupleIndexMap<
  Arr extends ReadonlyArray<keyof Mapping>,
  Mapping extends { readonly [K in Arr[number]]: unknown },
> = { readonly [K in keyof Arr]: Mapping[Arr[K]] }

/** Runtime counterpart of {@link TupleIndexMap}. Maps each key in `arr` through `mapping`. */
export const tupleIndexMap = <
  Arr extends ReadonlyArray<keyof Mapping>,
  Mapping extends { readonly [K in Arr[number]]: unknown },
>(
  arr: Arr,
  mapping: Mapping
): TupleIndexMap<Arr, Mapping> => {
  return arr.map((x) => mapping[x] as unknown) as unknown as TupleIndexMap<
    Arr,
    Mapping
  >
}
