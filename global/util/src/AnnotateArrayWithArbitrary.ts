import { Arbitrary, Schema, type FastCheck } from 'effect'

export const AnnotateArrayWithArbitrary =
  (constraints: FastCheck.ArrayConstraints) =>
  <A, I, R>(schema: Schema.Array$<Schema.Schema<A, I, R>>) =>
    Schema.annotations(schema, {
      arbitrary: (): Arbitrary.LazyArbitrary<ReadonlyArray<A>> => (fc) =>
        fc.oneof(
          fc.constant<ReadonlyArray<never>>([]),
          fc.array(Arbitrary.make<A, I, R>(schema.value), constraints)
        ),
    })
