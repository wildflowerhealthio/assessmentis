/* eslint-disable @typescript-eslint/no-explicit-any */

import { Schema } from 'effect'

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

type MergeableClass =
  | {
      readonly fields: Schema.Struct.Fields
      new (...args: any[]): object
    }
  | (Schema.Struct.Fields & { readonly fields?: never })

type MergeableClassFields<Klass extends MergeableClass> = Klass extends {
  readonly fields: infer F
}
  ? F
  : Klass
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
type MergeableClassStatic<Klass extends MergeableClass> = Klass extends {
  readonly fields: Schema.Struct.Fields
  new (...args: any[]): any
}
  ? Omit<Klass, (typeof SchemaClassKeys)[number]>
  : object

type TupleToIntersection<Base, T extends ReadonlyArray<Base>> = {
  [K in keyof T]: (x: T[K]) => void
} extends {
  [K: number]: (x: infer I) => void
}
  ? I extends Base
    ? Schema.Simplify<I>
    : never
  : never

type MissingSelfGeneric<
  Usage extends string,
  Params extends string = '',
> = `Missing \`Self\` generic - use \`class Self extends ${Usage}<Self>()(${Params}{ ... })\``

export const MergeClasses =
  <Self = never>(identifier: string) =>
  <Classes extends ReadonlyArray<MergeableClass>>(
    ...classes: Classes
    // annotations?: Schema.ClassAnnotations<Self, Schema.Simplify<Schema.Struct.Type<TupleToIntersection<Schema.Struct.Fields, { [K in keyof Classes]: MergeableClassFields<Classes[K]> }>>>>
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
      (acc, cls) => ({ ...acc, ...('fields' in cls ? cls.fields : cls) }),
      {} as any
    )
    const base = Schema.Class<Self>(identifier)(mergedFields)
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
      const mixinProtoDescriptors = Object.getOwnPropertyDescriptors(
        cls.prototype
      )

      for (const schemaClassKey of SchemaClassKeys) {
        if (typeof schemaClassKey === 'string') {
          delete mixinProtoDescriptors[schemaClassKey]
        }
      }
      delete (mixinProtoDescriptors as any).constructor
      Object.defineProperties(
        Object.getPrototypeOf(base.prototype),
        mixinProtoDescriptors
      )
    }
    return base as any
  }
