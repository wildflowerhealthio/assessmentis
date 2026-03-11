import { Data, type Schema } from 'effect'

import { Resource, type WithId } from '@assessmentis/effectful-store'

interface BaseResource {
  resourceType: string
  id?: string | undefined
}

/**
 * Creates a {@link ClinicalResourceBehaviour} bundle for a FHIR resource type.
 *
 * @typeParam T - The decoded domain resource type
 * @typeParam TEncoded - The encoded (wire-format) representation
 * @param args - Resource symbol, resourceType literal, and Effect Schema
 * @returns A behaviour object with constructors, schema, and resource metadata
 */
export const ClinicalResourceBehaviourImpl = <
  T extends BaseResource & Resource.Resource<string>,
  TEncoded,
>({
  ResourceSymbol,
  resourceType,
  Schema,
}: {
  readonly ResourceSymbol: T[Resource.ResourceType]
  readonly resourceType: T['resourceType']
  readonly Schema: Schema.Schema<T, TEncoded, never>
}): ClinicalResourceBehaviour<T, TEncoded> => {
  return {
    [Resource.ResourceType]: ResourceSymbol,
    resourceType,
    make: Data.case<T>(),
    makeWithId: Data.case<WithId<T>>(),
    Schema,
  }
}

/**
 * Standard toolkit for working with a clinical resource: its symbol, literal
 * `resourceType`, `Data.case` constructors, and Effect Schema.
 *
 * @typeParam T - The decoded domain resource type
 * @typeParam TEncoded - The encoded (wire-format) representation
 *
 * @remarks
 * Every resource registered in {@link ResourceDataTypes} is backed by one of
 * these. The `make` constructor produces instances without an `id`; use
 * `makeWithId` for instances that already have a server-assigned identity.
 */
export interface ClinicalResourceBehaviour<
  T extends BaseResource & Resource.Resource<string>,
  TEncoded,
> {
  readonly [Resource.ResourceType]: T[Resource.ResourceType]
  readonly resourceType: T['resourceType']
  readonly make: Data.Case.Constructor<T>
  readonly makeWithId: Data.Case.Constructor<WithId<T>>
  readonly Schema: Schema.Schema<T, TEncoded, never>
}
