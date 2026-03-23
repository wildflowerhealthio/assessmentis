// oxlint-disable typescript/no-unsafe-type-assertion
import type { ReadonlyRecord } from 'effect/Record'

/** Symbol key that stores the key tuple inside a {@link MappedRecord}. */
const KeyList = Symbol('KeyList')
type KeyList = typeof KeyList

/**
 * A record augmented with a compile-time key tuple, enabling type-safe
 * iteration and per-key transformations without losing key–value correlation.
 *
 * @typeParam Keys - Tuple of string literal keys the record contains
 * @typeParam O - Object type mapping each key to its value
 */
type MappedRecord<
  Keys extends readonly string[],
  O extends {
    [K in Keys[number]]: NonNullable<unknown>
  },
> = O & {
  readonly [KeyList]: Keys
}

type AnyMappedRecord<Keys extends readonly string[]> = MappedRecord<
  Keys,
  {
    [K in Keys[number]]: NonNullable<unknown>
  }
>

/**
 * Constructs a {@link MappedRecord} from an array of `[key, value]` entries,
 * preserving the key tuple for downstream type-safe iteration.
 *
 * @param entries - Array of `[key, value]` tuples
 */
const fromEntries = <
  Keys extends readonly string[],
  O extends {
    [K in Keys[number]]: NonNullable<unknown>
  },
>(
  entries: { [I in keyof Keys]: [Keys[I], O[Keys[I]]] } & readonly unknown[]
): MappedRecord<Keys, O> => {
  return {
    [KeyList]: entries.map(([key]) => key) as any,
    ...(Object.fromEntries(entries) as any),
  }
}
/**
 * Groups an array of items by the value at a specified key, preserving
 * discriminated union narrowing in the result type.
 *
 * Unlike `Array.groupBy` from Effect (which returns `Record<string, NonEmptyArray>`),
 * this function's return type maps each possible value of `A[D]` to the
 * corresponding union member, enabling type-safe dispatch over grouped results.
 *
 * @typeParam D - The key to group by
 * @typeParam A - The item type, must have a string value at key `D`
 *
 * @example
 * ```ts
 * type Request = { _tag: 'Get'; url: string } | { _tag: 'Search'; params: object }
 *
 * const grouped = groupBy([getReq, searchReq], '_tag')
 * // Type: { Get?: { _tag: 'Get'; url: string }[]; Search?: { _tag: 'Search'; params: object }[] }
 * ```
 */
const groupBy = <D extends string, A extends ReadonlyRecord<D, string>>(
  values: readonly A[],
  key: D
): MappedRecord<readonly A[D][], { [K in A[D]]: Extract<A, ReadonlyRecord<D, K>>[] }> => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const result = {} as any as MappedRecord<
    readonly A[D][],
    { [K in A[D]]: Extract<A, ReadonlyRecord<D, K>>[] }
  >
  for (const item of values) {
    const groupKey = item[key] as A[D]
    const group = result[groupKey]
    if (group) {
      group.push(item as any)
    } else {
      result[groupKey] = [item] as any
    }
  }
  return { ...result, [KeyList]: Object.keys(result) as any }
}

/**
 * Groups an array of items by the value at a specified key, pre-initializing
 * an entry for every key in the provided tuple — including keys with no
 * matching items (which get an empty array).
 *
 * Unlike {@link groupBy}, which only creates entries for keys present in
 * the data, this function guarantees every declared key exists in the result.
 *
 * @param keys - Exhaustive tuple of expected group keys
 * @param values - Items to distribute into groups
 * @param keyName - Property name to group by
 */
const groupInto = <
  KeyName extends string,
  Keys extends readonly string[],
  A extends ReadonlyRecord<KeyName, Keys[number]>,
>(
  keys: Keys,
  values: readonly A[],
  keyName: KeyName
): MappedRecord<Keys, { [K in Keys[number]]: Extract<A, ReadonlyRecord<KeyName, K>>[] }> => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const result = {
    [KeyList]: keys,
  } as any as MappedRecord<Keys, { [K in Keys[number]]: Extract<A, ReadonlyRecord<KeyName, K>>[] }>
  for (const key of keys as readonly Keys[number][]) {
    result[key] = [] as any
  }
  for (const item of values) {
    const groupKey = item[keyName] as Keys[number]
    const group = result[groupKey]
    if (group) {
      group.push(item as any)
    }
  }
  return result
}

/**
 * Transforms each defined value in a record with a single function,
 * preserving the key structure.
 *
 * @example
 * ```ts
 * const grouped = groupBy(requests, '_tag')
 * // { Get?: GetReq[]; Search?: SearchReq[] }
 *
 * const lengths = map(grouped, (items) => items.length)
 * // { Get: number; Search: number }
 * ```
 */
const map = <
  Keys extends readonly string[],
  Vs extends AnyMappedRecord<Keys>,
  B extends NonNullable<unknown>,
>(
  record: Vs,
  f: (value: Vs[Keys[number]]) => B
): MappedRecord<Keys, { [K in Keys[number]]: B }> => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const result = {
    [KeyList]: record[KeyList],
  } as MappedRecord<Keys, { [K in Keys[number]]: B }>
  for (const key of record[KeyList] as readonly Keys[number][]) {
    const value = record[key]
    result[key] = f(value) as any
  }
  return result
}

/**
 * Like {@link map}, but the mapping function is generic over the key index,
 * allowing it to return a different type per key.
 *
 * @param record - Source {@link MappedRecord}
 * @param f - Generic mapping function applied per key
 */
const mapGeneric = <
  Keys extends readonly string[],
  Vs extends AnyMappedRecord<Keys>,
  Os extends AnyMappedRecord<Keys>,
>(
  record: Vs,
  f: <I extends keyof Keys & number>(value: Vs[Keys[I]]) => Os[Keys[I]]
): Os => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const result = {} as Os
  for (const key of record[KeyList] as readonly Keys[number][]) {
    const value = record[key]
    result[key] = f(value)
  }
  return result
}

/**
 * Yields `[key, value]` pairs from a record, preserving per-key type
 * narrowing from mapped types.
 *
 * `Object.entries` widens keys to `string` and merges all value types
 * into a single union, losing the correlation between a specific key and
 * its corresponding value type. This function retains that mapping by
 * returning a union of correlated tuples.
 *
 * @example
 * ```ts
 * type Grouped = { Get?: GetReq[]; Search?: SearchReq[] }
 * for (const [key, values] of entriesOf(grouped)) {
 *   // key: 'Get' | 'Search'
 *   // values: GetReq[] | SearchReq[]  (correlated per-entry at runtime)
 * }
 * ```
 */
function entriesOf<Keys extends readonly string[], M extends AnyMappedRecord<Keys>>(
  record: M
): Array<{ [K in keyof M & string]: [K, M[K]] }[keyof M & string]> {
  const keys = record[KeyList] as readonly Keys[keyof Keys & number][]
  return keys.map((key) => {
    const value = record[key]
    return [key, value]
  }) as any
}

/**
 * Applies a per-key function record to a values record, preserving
 * per-key return types. Each key in `values` is mapped through the
 * corresponding function in `fs`. Undefined entries in `values` are
 * skipped.
 *
 * Unlike {@link map} (one function for all keys), `flatMap` takes a
 * separate function per key, so the return type varies by key.
 *
 * @example
 * ```ts
 * const grouped = groupBy(requests, '_tag')
 * // { Get?: GetReq[]; Search?: SearchReq[] }
 *
 * const results = flatMap(grouped, {
 *   Get: (reqs) => reqs.map(handleGet),     // returns Effect[]
 *   Search: (reqs) => reqs.map(handleSearch) // returns Effect[]
 * })
 * // { Get?: Effect[]; Search?: Effect[] }
 * ```
 */
const flatMap = <
  Keys extends readonly string[],
  Vs extends AnyMappedRecord<Keys>,
  ReturnTypes extends AnyMappedRecord<Keys>,
>(
  values: Vs,
  fs: { readonly [K in Keys[number]]: (v: Vs[K]) => ReturnTypes[K] }
): ReturnTypes => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const result = {
    [KeyList]: values[KeyList],
  } as ReturnTypes
  for (const key of values[KeyList] as readonly Keys[number][]) {
    const value = values[key]
    const fn = fs[key]
    result[key] = fn(value)
  }
  return result
}

/**
 * Pairs values from two records by key, producing a record of tuples
 * for every key in the provided key tuple.
 *
 * @param keys - Tuple of keys to zip over
 * @param a - First source record
 * @param b - Second source record
 *
 * @example
 * ```ts
 * const reqs = groupBy([r1, r2], '_tag')
 * const effs = groupBy([e1, e2], '_tag')
 *
 * const zipped = zip(reqs[KeyList], reqs, effs)
 * // { Get: [GetReq[], GetEff[]]; Search: [SearchReq[], SearchEff[]] }
 * ```
 */
const zip = <
  InnerKeys extends readonly string[],
  A extends AnyMappedRecord<InnerKeys>,
  B extends AnyMappedRecord<InnerKeys>,
>(
  keys: InnerKeys,
  a: A,
  b: B
): MappedRecord<InnerKeys, { [K in InnerKeys[number]]: [A[K], B[K]] }> => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const result = { [KeyList]: keys } as unknown as MappedRecord<
    InnerKeys,
    { [K in InnerKeys[number]]: [A[K], B[K]] }
  >
  for (const key of keys as readonly InnerKeys[number][]) {
    const aValue = a[key]
    const bValue = b[key]
    result[key] = [aValue, bValue] as any
  }
  return result
}

/**
 * Applies a per-key function record to a values record, pairing each
 * original value with its transformed result. Equivalent to
 * `zip(record, flatMap(record, fns))` but in a single pass.
 *
 * @example
 * ```ts
 * const grouped = groupBy(requests, '_tag')
 * const applied = apply(grouped, {
 *   Get: (reqs) => reqs.map(handleGet),
 *   Search: (reqs) => reqs.map(handleSearch),
 * })
 * // { Get: [GetReq[], Effect[]]; Search: [SearchReq[], Effect[]] }
 * ```
 */
const apply = <
  Keys extends readonly string[],
  Vs extends AnyMappedRecord<Keys>,
  Fs extends { readonly [K in Keys[number]]: (value: Vs[K]) => NonNullable<unknown> },
>(
  record: Vs,
  fns: Fs
): MappedRecord<Keys, { [K in Keys[number]]: [Vs[K], ReturnType<Fs[K]>] }> => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const result = {
    [KeyList]: record[KeyList],
  } as MappedRecord<Keys, { [K in Keys[number]]: [Vs[K], ReturnType<Fs[K]>] }>
  for (const key of record[KeyList]) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const fn = fns[key as Keys[number]] as any
    const value = record[key as Keys[number]]
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    result[key as Keys[number]] = [value, fn(value)] as any
  }
  return result
}
export type { MappedRecord }
export { KeyList, fromEntries, groupBy, groupInto, map, mapGeneric, flatMap, zip, apply, entriesOf }
