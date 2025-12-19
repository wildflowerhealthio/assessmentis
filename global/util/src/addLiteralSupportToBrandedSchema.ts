import { Schema, Brand } from 'effect'

export const addLiteralSupportToBrandedSchema = <
  A,
  I,
  R,
  B extends string | symbol,
>(
  schema: Schema.brand<Schema.Schema<A, I, R>, B>
): Schema.brand<Schema.Schema<A, I, R>, B> & {
  literal: <const L extends A>(
    l: Brand.Brand.Unbranded<L & Brand.Brand<B>>
  ) => L & Brand.Brand<B>
} => {
  const updatedSchema = schema as Schema.brand<Schema.Schema<A, I, R>, B> & {
    literal: <L extends A>(
      l: Brand.Brand.Unbranded<L & Brand.Brand<B>>
    ) => L & Brand.Brand<B>
  }

  const lit = <L extends A>(
    l: Brand.Brand.Unbranded<L & Brand.Brand<B>>
  ): L & Brand.Brand<B> => {
    return Brand.nominal<L & Brand.Brand<B>>()(l)
  }
  updatedSchema.literal = lit
  return updatedSchema
}
