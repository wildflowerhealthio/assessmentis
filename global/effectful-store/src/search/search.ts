import type { Schema as EffectSchema } from 'effect'

import type { Condition } from './condition'

/**
 * Describes a single searchable field: its value type (via a Schema that
 * provides the branded type) and the condition tags allowed on this field.
 *
 * @typeParam V - The value type for this field (e.g. a branded ReadonlyUrl)
 * @typeParam Tags - Tuple of allowed condition tag literals
 */
type Field<V, Tags extends readonly Condition<V>['_tag'][]> = {
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any -- encoded type is irrelevant for field descriptors
  readonly schema: EffectSchema.Schema<V, any>
  readonly conditions: Tags
}

/**
 * Creates a field descriptor pairing a value Schema with allowed condition tags.
 *
 * @example
 * ```typescript
 * static readonly SearchSchema = {
 *   patient: Search.field(Patient.UrlSchema, ['Exactly']),
 *   status: Search.field(Schema.String, ['Exactly', 'AnyOf']),
 * } as const satisfies Search.Schema
 * ```
 */
const field = <V, const Tags extends readonly Condition<V>['_tag'][]>(
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any -- encoded type is irrelevant for field descriptors
  schema: EffectSchema.Schema<V, any>,
  conditions: Tags
): Field<V, Tags> => ({ schema, conditions })

/**
 * Declaration on a DomainClass — maps field names to {@link Field} descriptors.
 * Each field specifies its value type and allowed condition tags.
 *
 * @example
 * ```typescript
 * static readonly SearchSchema = {
 *   patient: Search.field(Patient.UrlSchema, ['Exactly']),
 *   encounter: Search.field(Encounter.UrlSchema, ['Exactly', 'AnyOf']),
 * } as const satisfies Search.Schema
 * ```
 */
type Schema = {
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  readonly [K: string]: Field<any, readonly Condition<any>['_tag'][]>
}

/**
 * Derives the input object type from a {@link Schema}. Each declared field
 * becomes an optional property accepting only the condition variants whose
 * value type matches the field's Schema and whose tag is in the allowed list.
 */
type Query<Sch extends Schema> = {
  readonly [K in keyof Sch]?: Sch[K] extends Field<infer V, infer Tags>
    ? Extract<Condition<V>, { _tag: Tags[number] }>
    : never
}

/** Extracts a class's {@link Schema} via structural typing. */
type InferSearchSchema<Klass> = Klass extends { readonly SearchSchema: infer S extends Schema }
  ? S
  : Record<string, never>

/** Shorthand — the {@link Query} type for a given class. */
type QueryFor<Klass> = Query<InferSearchSchema<Klass>>

export type { Field, Schema, Query, InferSearchSchema, QueryFor }
export { field }
