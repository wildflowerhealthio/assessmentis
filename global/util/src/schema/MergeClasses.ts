/* eslint-disable @typescript-eslint/no-explicit-any */

import { Array, Schema } from 'effect'
import type { NonEmptyReadonlyArray } from 'effect/Array'

import type { TupleToIntersection } from '../types/TupleToIntersection'

/**
 * Keys that belong to the `Schema.Class` infrastructure and must NOT be
 * copied when merging statics or prototype members from input classes.
 */
const SchemaClassKeys = [
  'prototype',
  'Type',
  'Encoded',
  'Context',
  Schema.TypeId,
  'pipe',
  'ast',
  'make',
  'annotations',
  'fields',
  'identifier',
  'extend',
  'transformOrFail',
  'transformOrFailFrom',
] as const

/**
 * A class-like value that can be merged:
 * - A `Schema.Class` (has `fields` + is constructable), or
 * - A plain `Schema.Struct.Fields` record (no `fields` property).
 */
type MergeableClass =
  | {
      readonly fields: Schema.Struct.Fields
      new (...args: any[]): object
    }
  | (Schema.Struct.Fields & { readonly fields?: never })

/**
 * Extracts the `Schema.Struct.Fields` from a `MergeableClass`.
 * For a `Schema.Class` this is `Klass['fields']`; for a plain fields
 * record it is the record itself.
 */
type MergeableClassFields<Klass extends MergeableClass> = Klass extends {
  readonly fields: infer F
}
  ? F
  : Klass

/**
 * Extracts the non-field, non-Schema instance members from a `Schema.Class`.
 * These are the custom methods / getters defined on the class prototype.
 */
type MergeableClassInstance<Klass extends MergeableClass> = Klass extends {
  readonly fields: Schema.Struct.Fields
  new (...args: any[]): infer Instance
}
  ? Omit<
      Instance,
      | (typeof SchemaClassKeys)[number]
      | keyof Schema.Struct.Type<Klass['fields']>
    >
  : object

/**
 * Extracts the non-Schema static members from a `Schema.Class` constructor.
 */
type MergeableClassStatic<Klass extends MergeableClass> = Klass extends {
  readonly fields: Schema.Struct.Fields
  new (...args: any[]): any
}
  ? Omit<Klass, (typeof SchemaClassKeys)[number]>
  : object

type MissingSelfGeneric<
  Usage extends string,
  Params extends string = '',
> = `Missing \`Self\` generic - use \`class Self extends ${Usage}<Self>()(${Params}{ ... })\``

/**
 * Schema annotations tuple for a merged class.
 * Follows the same convention as `Schema.Class`:
 * `[toAnnotations?, transformAnnotations?, fromAnnotations?]`.
 */
export type ClassAnnotation<Self> =
  | readonly []
  | readonly [
      (
        // Annotations for the "to" schema
        Schema.Annotations.Schema<Self> | undefined
      ),
      // Annotations for the "transformation schema
      (Schema.Annotations.Schema<Self> | undefined)?,
      // Annotations for the "from" schema
      // Disabled for now
      undefined?,
      // Schema.Annotations.Schema<A>?,
    ]

/**
 * Merges multiple `Schema.Class` definitions (or plain `Schema.Struct.Fields`
 * records) into a single `Schema.Class`.
 *
 * The merged class inherits:
 * - **Fields** — the intersection of all input classes' fields.
 * - **Prototype methods** — walked from each input class's prototype chain.
 * - **Static members** — enumerable statics (own + inherited) from each input.
 *
 * Usage follows the same two-call pattern as `Schema.Class`:
 * ```ts
 * class AB extends MergeClasses<AB>('AB')([], ClassA, ClassB) { }
 * ```
 *
 * @param identifier - The schema identifier string for the merged class.
 */
export const MergeClasses =
  <Self = never>(identifier: string) =>
  <Classes extends NonEmptyReadonlyArray<MergeableClass>>(
    annotations: ClassAnnotation<Self>,
    ...classes: Classes
  ): [Self] extends [never]
    ? MissingSelfGeneric<'Class'>
    : Schema.Class<
        Self,
        TupleToIntersection<
          Schema.Struct.Fields,
          { [K in keyof Classes]: MergeableClassFields<Classes[K]> }
        >,
        Schema.Struct.Encoded<
          TupleToIntersection<
            Schema.Struct.Fields,
            { [K in keyof Classes]: MergeableClassFields<Classes[K]> }
          >
        >,
        Schema.Struct.Context<
          TupleToIntersection<
            Schema.Struct.Fields,
            { [K in keyof Classes]: MergeableClassFields<Classes[K]> }
          >
        >,
        Schema.Struct.Constructor<
          TupleToIntersection<
            Schema.Struct.Fields,
            { [K in keyof Classes]: MergeableClassFields<Classes[K]> }
          >
        >,
        TupleToIntersection<
          object,
          { [K in keyof Classes]: MergeableClassInstance<Classes[K]> }
        >,
        object
      > &
        TupleToIntersection<
          object,
          { [K in keyof Classes]: MergeableClassStatic<Classes[K]> }
        > => {
    type Fields = TupleToIntersection<
      Schema.Struct.Fields,
      { [K in keyof Classes]: MergeableClassFields<Classes[K]> }
    >

    const mergedFields: Fields = classes.reduce(
      (acc: any, cls) => ({
        ...acc,
        ...('fields' in cls ? cls.fields : cls),
      }),
      {} as any
    )
    const base = Schema.Class<Self>(identifier)(
      mergedFields,
      Array.isNonEmptyReadonlyArray(annotations) ? annotations : [undefined]
    )
    if (typeof base === 'string') {
      throw new Error('Expected Schema.Class to return a class constructor')
    }

    for (const cls of classes) {
      if (!('fields' in cls)) continue

      // Copy all enumerable statics (own + inherited), skipping Schema
      // internals.  `for...in` (vs Object.assign) ensures statics inherited
      // via the constructor prototype chain survive when a MergeClasses
      // result is used as mixin input to another MergeClasses call.
      for (const key in cls) {
        if (SchemaClassKeys.includes(key as any)) continue
        ;(base as any)[key] = (cls as any)[key]
      }
      // Walk the full prototype chain of the mixin (not just own properties)
      // so that methods added to an intermediate prototype (e.g. by
      // DatatypeChoice's Object.assign) survive through subclasses.
      const target = Object.getPrototypeOf(base.prototype)
      let current = cls.prototype
      while (current && current !== Object.prototype) {
        const descriptors = Object.getOwnPropertyDescriptors(current)
        delete (descriptors as any).constructor
        for (const schemaClassKey of SchemaClassKeys) {
          if (typeof schemaClassKey === 'string') {
            delete descriptors[schemaClassKey]
          }
        }
        for (const [key, desc] of Object.entries(descriptors)) {
          if (!Object.getOwnPropertyDescriptor(target, key)) {
            Object.defineProperty(target, key, desc)
          }
        }
        current = Object.getPrototypeOf(current)
      }
    }

    return base as any
  }
