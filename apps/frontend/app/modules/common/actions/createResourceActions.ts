import type {
  ClinicalDataRepositoryErrors,
  ResourceDataTypes,
  ResourceType,
} from '@assessmentis/clinical-domain'
import type { Resource } from '@assessmentis/effectful-store'
import type { NotFoundError } from '@assessmentis/ontology'
import { Effect } from 'effect'
import { ClinicalDataRepositoryService } from '../../../layers/ClinicalDataRepositoriesService'
import type { NoSelectedOrgError } from '../../../../../../domain/platform-domain/src/hostedServices'

/**
 * Creates a generic create action for a resource
 *
 * This factory function reduces duplication across resource create actions by
 * encapsulating the common pattern of:
 * 1. Getting the repository from the Effect context
 * 2. Transforming form data to resource format
 * 3. Calling repository.create()
 *
 * The factory preserves full type safety by requiring explicit type parameters.
 * The TRequirements parameter allows specifying a broader context type (like
 * ClientRuntimeContext) that includes the repository, enabling the action to
 * be used with runtime contexts.
 *
 * @example
 * ```typescript
 * export const createPatient = createResourceCreateAction<
 *   PatientFormData,
 *   Patient,
 *   UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
 *   typeof PatientRepository,
 *   ClientRuntimeContext
 * >(PatientRepository, transformToPatient)
 * ```
 */
export function createResourceCreateAction<
  TFormData,
  Key extends ResourceType,
>(
  resourceType: Key,
  transform: (data: TFormData) => ResourceDataTypes[Key]
): (
  formData: TFormData
) => Effect.Effect<
  Resource.WithResourceUrl<ResourceDataTypes[Key]>,
  ClinicalDataRepositoryErrors | NoSelectedOrgError,
  ClinicalDataRepositoryService
> {
  return (
    formData: TFormData
  ): Effect.Effect<
    Resource.WithResourceUrl<ResourceDataTypes[Key]>,
    ClinicalDataRepositoryErrors | NoSelectedOrgError,
    ClinicalDataRepositoryService
  > => {
    return Effect.gen(function* () {
      const service: ClinicalDataRepositoryService =
        yield* ClinicalDataRepositoryService
      const repo = yield* service.repositoryEffect(resourceType)
      const resource = transform(formData)
      return yield* repo.create(resource)
    })
  }
}

/**
 * Creates a generic update action for a resource
 *
 * This factory function reduces duplication across resource update actions by
 * encapsulating the common pattern of:
 * 1. Getting the repository from the Effect context
 * 2. Transforming form data to resource format
 * 3. Merging with current resource and url
 * 4. Calling repository.update()
 *
 * The factory preserves full type safety by requiring explicit type parameters.
 * The TRequirements parameter allows specifying a broader context type (like
 * ClientRuntimeContext) that includes the repository, enabling the action to
 * be used with runtime contexts.
 *
 * @example
 * ```typescript
 * export const updatePatient = createResourceUpdateAction<
 *   PatientFormData,
 *   Patient,
 *   PatientId,
 *   UnhandledError | NeedsAuthenticationError | ExternalAssertionError | NotFoundError,
 *   typeof PatientRepository,
 *   ClientRuntimeContext
 * >(PatientRepository, transformToPatient)
 * ```
 */
export function createResourceUpdateAction<
  TFormData,
  Key extends ResourceType,
>(
  resourceType: Key,
  transform: (data: TFormData) => Omit<ResourceDataTypes[Key], ''>
): (
  url: NonNullable<ResourceDataTypes[Key]['url']>,
  current: ResourceDataTypes[Key],
  formData: TFormData
) => Effect.Effect<
  ResourceDataTypes[Key],
  | ClinicalDataRepositoryErrors
  | NoSelectedOrgError
  | NotFoundError<ResourceDataTypes[Key]['domainType'], { url: NonNullable<ResourceDataTypes[Key]['url']> }>,
  ClinicalDataRepositoryService
> {
  return (
    url: NonNullable<ResourceDataTypes[Key]['url']>,
    current: ResourceDataTypes[Key],
    formData: TFormData
  ): Effect.Effect<
    ResourceDataTypes[Key],
    | ClinicalDataRepositoryErrors
    | NoSelectedOrgError
    | NotFoundError<ResourceDataTypes[Key]['domainType'], { url: NonNullable<ResourceDataTypes[Key]['url']> }>,
    ClinicalDataRepositoryService
  > => {
    return Effect.gen(function* () {
      const service: ClinicalDataRepositoryService =
        yield* ClinicalDataRepositoryService
      const repo = yield* service.repositoryEffect(resourceType)
      const updatedFields = transform(formData)
      const updated = {
        ...current,
        ...updatedFields,
        url,
      }
      return yield* repo.update(updated)
    })
  }
}
