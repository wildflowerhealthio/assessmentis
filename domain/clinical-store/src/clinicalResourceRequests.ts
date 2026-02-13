import type { Schema } from 'effect'
import {
  GetResource as BaseGetResource,
  SearchResources as BaseSearchResources,
  CreateResource as BaseCreateResource,
  UpdateResource as BaseUpdateResource,
  DeleteResource as BaseDeleteResource,
} from '@assessmentis/effectful-store'
import type { Schemas } from '@assessmentis/clinical-domain'
import type {
  ClinicalDataRepositoryErrors,
  ClinicalDataRepositoryErrorsWithNotFound,
  RepositoryFilters,
} from '@assessmentis/clinical-domain'
import type { WithId } from '@assessmentis/clinical-domain/data-types'

/**
 * Type helper to extract Schema.Type from Schema map
 */
type SchemaType<Key extends keyof typeof Schemas> = Schema.Schema.Type<
  (typeof Schemas)[Key]
>

/**
 * Clinical-specific request to get a single resource by ID
 */
export class GetClinicalResource<
  Key extends keyof typeof Schemas,
> extends BaseGetResource<
  WithId<SchemaType<Key>>,
  ClinicalDataRepositoryErrorsWithNotFound<SchemaType<Key>>,
  SchemaType<Key>
> {
  constructor(
    readonly payload: {
      readonly resourceType: SchemaType<Key>['resourceType']
      readonly id: string
    }
  ) {
    super(payload)
  }
}

/**
 * Clinical-specific request to search for resources
 */
export class SearchClinicalResources<
  Key extends keyof typeof Schemas,
> extends BaseSearchResources<
  readonly WithId<SchemaType<Key>>[],
  ClinicalDataRepositoryErrors,
  SchemaType<Key>,
  RepositoryFilters<SchemaType<Key>>
> {
  constructor(
    readonly payload: {
      readonly resourceType: SchemaType<Key>['resourceType']
      readonly params?: RepositoryFilters<SchemaType<Key>>
    }
  ) {
    super(payload)
  }
}

/**
 * Clinical-specific request to create a resource
 */
export class CreateClinicalResource<
  Key extends keyof typeof Schemas,
> extends BaseCreateResource<
  WithId<SchemaType<Key>>,
  ClinicalDataRepositoryErrors,
  SchemaType<Key>
> {
  constructor(
    readonly payload: {
      readonly resourceType: SchemaType<Key>['resourceType']
      readonly resource: SchemaType<Key>
    }
  ) {
    super(payload)
  }
}

/**
 * Clinical-specific request to update a resource
 */
export class UpdateClinicalResource<
  Key extends keyof typeof Schemas,
> extends BaseUpdateResource<
  WithId<SchemaType<Key>>,
  ClinicalDataRepositoryErrorsWithNotFound<SchemaType<Key>>,
  WithId<SchemaType<Key>>
> {
  constructor(
    readonly payload: {
      readonly resourceType: SchemaType<Key>['resourceType']
      readonly resource: WithId<SchemaType<Key>>
    }
  ) {
    super(payload)
  }
}

/**
 * Clinical-specific request to delete a resource
 */
export class DeleteClinicalResource<
  Key extends keyof typeof Schemas,
> extends BaseDeleteResource<
  ClinicalDataRepositoryErrorsWithNotFound<SchemaType<Key>>,
  SchemaType<Key>
> {
  constructor(
    readonly payload: {
      readonly resourceType: SchemaType<Key>['resourceType']
      readonly id: string
    }
  ) {
    super(payload)
  }
}
