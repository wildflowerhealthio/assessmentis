/* eslint-disable @typescript-eslint/no-explicit-any */

import type { FastCheck } from 'effect'
import { Arbitrary, Schema } from 'effect'
import type { TupleToIntersection } from './TupleToIntersection'

/**
 * Something `mergeArbitraries` can extract an arbitrary from:
 * - A `LazyArbitrary` function (no `fields` property)
 * - A Schema.Class (has `fields` + is constructable)
 * - A plain `Schema.Struct.Fields` object (has no `fields` property but
 *   every value is a Schema — distinguished from LazyArbitrary by not
 *   being callable)
 */
export type ArbitrarySource =
  | Arbitrary.LazyArbitrary<any>
  | { readonly fields: Schema.Struct.Fields; new (...args: any[]): any }
  | (Schema.Struct.Fields & { readonly fields?: never })

type SourceType<T extends ArbitrarySource> =
  T extends Arbitrary.LazyArbitrary<infer A>
    ? A
    : T extends {
          readonly fields: Schema.Struct.Fields
          new (...args: any[]): any
        }
      ? Schema.Schema.Type<T['fields']>
      : T extends Schema.Struct.Fields
        ? Schema.Schema.Type<T>
        : never

const isLazyArbitrary = (
  src: ArbitrarySource
): src is Arbitrary.LazyArbitrary<any> =>
  typeof src === 'function' && !('fields' in src)

const isSchemaClass = (
  src: ArbitrarySource
): src is {
  readonly fields: Schema.Struct.Fields
  new (...args: any[]): any
} => typeof src === 'function' && 'fields' in src

/**
 * Compose multiple arbitrary sources into a single `LazyArbitrary`.
 *
 * Each source is generated independently, then all results are spread
 * into one object (`Object.assign({}, ...results)`).
 *
 * Accepts:
 * - `LazyArbitrary` — used directly
 * - Schema.Class — arbitrary extracted via `Arbitrary.make`
 * - Plain `Schema.Struct.Fields` — wrapped in `Schema.Struct` first
 */
export const mergeArbitraries =
  <Sources extends ReadonlyArray<ArbitrarySource>>(
    mapper: (x: any) => any,
    ...sources: Sources
  ): Arbitrary.LazyArbitrary<any> =>
  (fc: typeof FastCheck): FastCheck.Arbitrary<any> => {
    const arbs = sources.map((src) => {
      if (isLazyArbitrary(src)) return src(fc)
      if (isSchemaClass(src)) return Arbitrary.make(src as any)
      return Arbitrary.make(Schema.Struct(src as Schema.Struct.Fields))
    })
    return fc
      .tuple(...(arbs as [any, ...any[]]))
      .map((results) => Object.assign({}, ...results))
      .map(mapper)
  }
