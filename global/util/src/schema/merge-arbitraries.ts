/* oxlint-disable @typescript-eslint/no-explicit-any */

import { Arbitrary, Schema } from 'effect'
import type { FastCheck } from 'effect'

/**
 * A value that {@link mergeArbitraries} can extract an arbitrary from.
 *
 * @remarks
 * The three branches are distinguished at runtime by `typeof` and the
 * presence of a `fields` property:
 *
 * - **`LazyArbitrary`** — a bare function `(fc) => Arbitrary<T>`. Has no
 *   `fields` property.
 * - **Schema.Class** — a class constructor with a static `fields` record
 *   (e.g. `class Foo extends Schema.Class<...>{}`). Detected by
 *   `typeof src === 'function' && 'fields' in src`.
 * - **`Schema.Struct.Fields`** — a plain object whose values are schemas.
 *   Distinguished from `LazyArbitrary` by not being callable.
 */
export type ArbitrarySource =
  | Arbitrary.LazyArbitrary<any>
  | Schema.Schema.AnyNoContext
  | Schema.Struct.Fields

/**
 * Type guard: source is a bare `LazyArbitrary` function (not a class with `fields`).
 *
 * @param src - The arbitrary source to test
 * @returns `true` if `src` is callable and has no `fields` property
 */
const isLazyArbitrary = (src: ArbitrarySource): src is Arbitrary.LazyArbitrary<any> =>
  typeof src === 'function' && !('fields' in src)

/**
 * Compose multiple {@link ArbitrarySource | arbitrary sources} into a single
 * `LazyArbitrary` that produces a merged object.
 *
 * @param mapper - Post-merge transformation, typically a class constructor
 *   or factory function (e.g. `(x) => new MyClass(x)`)
 * @param sources - One or more arbitrary sources to merge
 * @returns A `LazyArbitrary` that produces the merged and mapped object
 *
 * @remarks
 * Each source is generated independently via `fc.tuple`, then all results
 * are shallow-merged with `Object.assign({}, ...results)`. `mapper` is
 * applied last — use it to construct a class instance from the merged fields.
 *
 * Source resolution:
 *
 * - `LazyArbitrary` — used directly.
 * - `Schema.Class` — arbitrary extracted via `Arbitrary.make`.
 * - `Schema.Struct.Fields` — wrapped in `Schema.Struct` first.
 */
export const mergeArbitraries =
  <Sources extends readonly ArbitrarySource[]>(
    mapper: (x: any) => any,
    ...sources: Sources
  ): Arbitrary.LazyArbitrary<any> =>
  (fc: typeof FastCheck): FastCheck.Arbitrary<any> => {
    const arbs = sources.map((src) => {
      if (isLazyArbitrary(src)) {
        return src(fc)
      }
      if (Schema.isSchema(src)) {
        return Arbitrary.make(src)
      }
      return Arbitrary.make(Schema.Struct(src))
    })
    return (
      fc
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        .tuple(...(arbs as [any, ...any[]]))
        .map((results) => Object.assign({}, ...results))
        .map((x) => mapper(x))
    )
  }
