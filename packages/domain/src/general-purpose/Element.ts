import { Effect, Schema } from "effect";

export const Element = <IdType extends string = string>(
  idSchema: Schema.Schema<IdType, string>,
) =>
  Schema.Struct({
    id: Schema.optional(idSchema),
  });

export type Element<IdType extends string = string> = ReturnType<typeof Element<IdType>>['Type'];


export type WithId<A extends { id?: string | undefined }> = A & { 
  id: NonNullable<A['id']>;
}

export const hasId = <IdType extends string, A extends Element<IdType>>(
  element: A,
): element is WithId<A> => {
  return element.id !== undefined;
};

export const assertId = <A extends { id?: string | undefined }>(a: A): Effect.Effect<WithId<A>, undefined, never> => 
  hasId(a)
    ? Effect.succeed(a)
    : Effect.fail(undefined);