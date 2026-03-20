import type { Condition } from './condition'

/**
 * Declaration on a DomainClass — maps field names to the condition tags
 * allowed for that field.
 *
 * @example
 * ```typescript
 * static readonly SearchSchema = {
 *   patient: ['Exactly'],
 *   status: ['Exactly', 'AnyOf'],
 * } as const satisfies Search.Schema
 * ```
 */
type Schema = {
  readonly [field: string]: readonly Condition['_tag'][]
}

/**
 * Derives the input object type from a {@link Schema}. Each declared field
 * becomes an optional property accepting only the condition variants listed
 * in the schema.
 */
type Query<S extends Schema> = {
  readonly [K in keyof S]?: Extract<Condition, { _tag: S[K][number] }>
}

/** Extracts a class's {@link Schema} via structural typing. */
type InferSearchSchema<Klass> = Klass extends { readonly SearchSchema: infer S extends Schema }
  ? S
  : Record<string, never>

/** Shorthand — the {@link Query} type for a given class. */
type QueryFor<Klass> = Query<InferSearchSchema<Klass>>

export type { Schema, Query, InferSearchSchema, QueryFor }
