import { Brand } from 'effect'
import type { Schema } from 'effect'

/**
 * Creates a branded literal constructor from a branded schema. Allows
 * writing type-safe literal values of a branded type without going
 * through full schema validation at runtime.
 *
 * @typeParam A - The unbranded base type
 * @typeParam B - The brand name (string or symbol)
 * @returns A function `(l: L) => L & Brand<B>` that applies the brand nominally
 */
export const literalOf =
  <A, I, R, B extends string | symbol>(_schema: Schema.brand<Schema.Schema<A, I, R>, B>) =>
  <L extends A>(l: Brand.Brand.Unbranded<L & Brand.Brand<B>>): L & Brand.Brand<B> =>
    Brand.nominal<L & Brand.Brand<B>>()(l)
