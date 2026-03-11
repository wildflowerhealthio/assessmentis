import { Brand, type Schema } from 'effect'

/**
 * Creates a branded literal constructor from a branded schema. Allows
 * writing type-safe literal values of a branded type without going
 * through full schema validation at runtime.
 *
 * @param _schema - The branded schema (used only for type inference)
 * @returns A function that brands a literal value
 */
export const literalOf =
  <A, I, R, B extends string | symbol>(
    _schema: Schema.brand<Schema.Schema<A, I, R>, B>
  ) =>
  <L extends A>(
    l: Brand.Brand.Unbranded<L & Brand.Brand<B>>
  ): L & Brand.Brand<B> => {
    return Brand.nominal<L & Brand.Brand<B>>()(l)
  }
