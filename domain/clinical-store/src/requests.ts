import { Request, Schema } from 'effect'
import {
  ClinicalDataRepositoryErrors,
  ClinicalDataRepositoryErrorsWithNotFound,
  RepositoryFilters,
} from '@assessmentis/clinical-domain'
import { WithId } from '@assessmentis/clinical-domain/data-types'

/**
 * Base type for resources that can be used in requests
 */
export type ClinicalResource = {
  resourceType: string
  id?: string | undefined
}

/**
 * Request to get a single resource by ID
 * @template T - The domain resource type (e.g., Encounter, Patient)
 */
export class GetResource<T extends ClinicalResource> extends Request.TaggedClass(
  'GetResource'
)<
  WithId<T>,
  ClinicalDataRepositoryErrorsWithNotFound<T>,
  {
    readonly resourceType: T['resourceType']
    readonly id: string
  }
> {}

/**
 * Request to search for resources matching the given parameters
 * @template T - The domain resource type (e.g., Encounter, Patient)
 */
export class SearchResources<T extends ClinicalResource> extends Request.TaggedClass(
  'SearchResources'
)<
  readonly WithId<T>[],
  ClinicalDataRepositoryErrors,
  {
    readonly resourceType: T['resourceType']
    readonly params?: RepositoryFilters<T>
  }
> {}

/**
 * Request to create a new resource
 * @template T - The domain resource type (e.g., Encounter, Patient)
 */
export class CreateResource<T extends ClinicalResource> extends Request.TaggedClass(
  'CreateResource'
)<
  WithId<T>,
  ClinicalDataRepositoryErrors,
  {
    readonly resourceType: T['resourceType']
    readonly resource: T
  }
> {}

/**
 * Request to update an existing resource
 * @template T - The domain resource type (e.g., Encounter, Patient)
 */
export class UpdateResource<T extends ClinicalResource> extends Request.TaggedClass(
  'UpdateResource'
)<
  WithId<T>,
  ClinicalDataRepositoryErrorsWithNotFound<T>,
  {
    readonly resourceType: T['resourceType']
    readonly resource: WithId<T>
  }
> {}

/**
 * Request to delete a resource by ID
 * @template T - The domain resource type (e.g., Encounter, Patient)
 */
export class DeleteResource<T extends ClinicalResource> extends Request.TaggedClass(
  'DeleteResource'
)<
  void,
  ClinicalDataRepositoryErrorsWithNotFound<T>,
  {
    readonly resourceType: T['resourceType']
    readonly id: string
  }
> {}
