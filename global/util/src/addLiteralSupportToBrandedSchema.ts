import { Schema, Brand } from 'effect'

export const literalOf =
  <A, I, R, B extends string | symbol>(
    _schema: Schema.brand<Schema.Schema<A, I, R>, B>
  ) =>
  <L extends A>(
    l: Brand.Brand.Unbranded<L & Brand.Brand<B>>
  ): L & Brand.Brand<B> => {
    return Brand.nominal<L & Brand.Brand<B>>()(l)
  }
