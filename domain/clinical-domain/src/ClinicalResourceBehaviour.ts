import type { BaseResource, WithId } from '@assessmentis/effectful-store'
import { Data, type Schema } from 'effect'

export const ClinicalResourceBehaviourImpl = <
  T extends BaseResource,
  TEncoded,
>({
  TypeId,
  resourceType,
  Schema,
}: {
  readonly TypeId: symbol
  readonly resourceType: T['resourceType']
  readonly Schema: Schema.Schema<T, TEncoded, never>
}): ClinicalResourceBehaviour<T, TEncoded> => {
  return {
    clinicalResourceTypeId: TypeId,
    resourceType,
    make: Data.case<T>(),
    makeWithId: Data.case<WithId<T>>(),
    Schema,
  }
}

export interface ClinicalResourceBehaviour<T extends BaseResource, TEncoded> {
  readonly clinicalResourceTypeId: symbol
  readonly resourceType: T['resourceType']
  readonly make: Data.Case.Constructor<T>
  readonly makeWithId: Data.Case.Constructor<WithId<T>>
  readonly Schema: Schema.Schema<T, TEncoded, never>
}
