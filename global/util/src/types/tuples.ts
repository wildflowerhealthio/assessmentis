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

export const tupleFilter = <Arr extends ReadonlyArray<unknown>, Test>(
  arr: Arr,
  predicate: (item: unknown) => item is Test
) => arr.filter((x): x is Test => predicate(x)) as TupleFilter<Arr, Test>

export type TupleIndexMap<
  Arr extends ReadonlyArray<keyof Mapping>,
  Mapping extends { readonly [K in Arr[number]]: unknown },
> = { readonly [K in keyof Arr]: Mapping[Arr[K]] }

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
