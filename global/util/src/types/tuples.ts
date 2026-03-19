/**
 * Type-level filter for tuples. Keeps only elements that extend `Test`,
 * preserving order and narrowing the tuple type accordingly.
 */
export type TupleFilter<Arr extends readonly unknown[], Test> = Arr extends readonly [
  infer Head,
  ...infer Rest,
]
  ? Rest extends readonly unknown[]
    ? Head extends Test
      ? [Head, ...TupleFilter<Rest, Test>]
      : TupleFilter<Rest, Test>
    : []
  : []

/** Runtime counterpart of {@link TupleFilter}. Filters an array with a type-guard predicate. */
export const tupleFilter = <Arr extends readonly unknown[], Test>(
  arr: Arr,
  predicate: (item: unknown) => item is Test
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
): TupleFilter<Arr, Test> => arr.filter((x): x is Test => predicate(x)) as TupleFilter<Arr, Test>

/**
 * Maps a tuple of keys through a record, producing a tuple of the
 * corresponding values in the same order.
 */
export type TupleIndexMap<
  Arr extends readonly (keyof Mapping)[],
  Mapping extends Readonly<Record<Arr[number], unknown>>,
> = { readonly [K in keyof Arr]: Mapping[Arr[K]] }

/** Runtime counterpart of {@link TupleIndexMap}. Maps each key in `arr` through `mapping`. */
export const tupleIndexMap = <
  Arr extends readonly (keyof Mapping)[],
  Mapping extends Readonly<Record<Arr[number], unknown>>,
>(
  arr: Arr,
  mapping: Mapping
): TupleIndexMap<Arr, Mapping> => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return arr.map((x) => mapping[x] as unknown) as unknown as TupleIndexMap<Arr, Mapping>
}
