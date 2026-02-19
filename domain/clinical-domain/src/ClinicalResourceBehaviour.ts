import { Resource, type WithId } from '@assessmentis/effectful-store'
import { Data, type Schema } from 'effect'

interface BaseResource {
  resourceType: string
  id?: string | undefined
}

export const ClinicalResourceBehaviourImpl = <
  T extends BaseResource & Resource.Resource<symbol, Resource.ReadonlyUrl>,
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

export interface ClinicalResourceBehaviour<
  T extends BaseResource & Resource.Resource<symbol, Resource.ReadonlyUrl>,
  TEncoded,
> {
  readonly [Resource.ResourceType]: T[Resource.ResourceType]
  readonly resourceType: T['resourceType']
  readonly make: Data.Case.Constructor<T>
  readonly makeWithId: Data.Case.Constructor<WithId<T>>
  readonly Schema: Schema.Schema<T, TEncoded, never>
}
