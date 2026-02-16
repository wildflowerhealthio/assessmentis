import type {
  ClinicalDataRepositoryErrors,
  ClinicalDataRepositoryErrorsWithNotFound,
  ResourceDataTypes,
} from '@assessmentis/clinical-domain'
import type { WithId } from '@assessmentis/effectful-store'
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
  Key extends keyof ResourceDataTypes,
>(
  resourceType: Key,
  transform: (data: TFormData) => ResourceDataTypes[Key]
): (
  formData: TFormData
) => Effect.Effect<
  WithId<ResourceDataTypes[Key]>,
  ClinicalDataRepositoryErrors | NoSelectedOrgError,
  ClinicalDataRepositoryService
> {
  return (
    formData: TFormData
  ): Effect.Effect<
    WithId<ResourceDataTypes[Key]>,
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
 * 3. Merging with current resource and id
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
  Key extends keyof ResourceDataTypes,
>(
  resourceType: Key,
  transform: (data: TFormData) => Omit<ResourceDataTypes[Key], 'id'>
): (
  id: NonNullable<ResourceDataTypes[Key]['id']>,
  current: ResourceDataTypes[Key],
  formData: TFormData
) => Effect.Effect<
  ResourceDataTypes[Key],
  | ClinicalDataRepositoryErrorsWithNotFound<ResourceDataTypes[Key]>
  | NoSelectedOrgError,
  ClinicalDataRepositoryService
> {
  return (
    id: NonNullable<ResourceDataTypes[Key]['id']>,
    current: ResourceDataTypes[Key],
    formData: TFormData
  ): Effect.Effect<
    ResourceDataTypes[Key],
    | ClinicalDataRepositoryErrorsWithNotFound<ResourceDataTypes[Key]>
    | NoSelectedOrgError,
    ClinicalDataRepositoryService
  > => {
    return Effect.gen(function* () {
      const service: ClinicalDataRepositoryService =
        yield* ClinicalDataRepositoryService
      const repo = yield* service.repositoryEffect(resourceType)
      const updatedFields = transform(formData)
      const updated: WithId<ResourceDataTypes[Key]> = {
        ...current,
        ...updatedFields,
        id,
      }
      return yield* repo.update(updated)
    })
  }
}
