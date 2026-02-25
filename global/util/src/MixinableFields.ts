/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Schema } from 'effect'

export type ClassWithMakeConstructor = (new (...args: any[]) => object) & {
  readonly Type: object
  readonly Encoded: object
  readonly Context: unknown
  make: (...args: any[]) => object
}

export type WithClassMixin<
  Base extends ClassWithMakeConstructor,
  Mixin extends ClassWithMakeConstructor,
> = {
  new (
    ...args: ConstructorParameters<Base>
  ): InstanceType<Base> & InstanceType<Mixin>
  Type: Schema.Simplify<Base['Type'] & InstanceType<Mixin>>
  Encoded: Schema.Simplify<Base['Encoded']>
  Context: Base['Context']
  annotations(
    annotations: Schema.Annotations.Schema<Base & InstanceType<Mixin>>
  ): Schema.SchemaClass<
    Base,
    Schema.Simplify<Schema.Schema.Encoded<Base>>,
    Schema.Schema.Context<Base>
  >
  make(
    ...args: ConstructorParameters<Base>
  ): InstanceType<Base> & InstanceType<Mixin>
} & Omit<Base, 'make' | 'prototype' | 'Type'> &
  Omit<Mixin, 'prototype' | keyof Base>

export const applySchemaMixinTo = <
  Base extends ClassWithMakeConstructor,
  Mixin extends ClassWithMakeConstructor,
>(
  base: Base,
  mixin: Mixin
): WithClassMixin<Base, Mixin> => {
  const ogMake = base.make.bind(base)

  Object.assign(base, mixin)
  const mixinProtoDescriptors = Object.getOwnPropertyDescriptors(
    mixin.prototype
  )
  delete (mixinProtoDescriptors as any).constructor
  Object.defineProperties(
    Object.getPrototypeOf(base.prototype),
    mixinProtoDescriptors
  )

  base.make = (...args: any[]) => {
    const instance = ogMake(...args)
    Object.defineProperties(instance, mixinProtoDescriptors)
    return instance
  }

  // Runtime prototype mutation can't be tracked by TS — assert through unknown
  return base as unknown as WithClassMixin<Base, Mixin>
}
