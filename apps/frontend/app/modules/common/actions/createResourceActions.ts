import {
  ClinicalDataRepositoryErrors,
  ClinicalDataRepositoryErrorsWithNotFound,
  Schemas,
} from '@assessmentis/clinical-domain'
import { WithId } from '@assessmentis/clinical-domain/data-types'
import { Effect, Schema } from 'effect'
import { ClinicalDataRepositoryService } from '../../../layers/ClinicalDataRepositoriesService'
import { NoSelectedOrgError } from '../../../../../../domain/platform-domain/src/hostedServices'

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
  TResource extends { id?: string; resourceType: string } & Schema.Schema.Type<
    (typeof Schemas)[keyof typeof Schemas]
  >,
>(
  resourceType: TResource['resourceType'],
  transform: (data: TFormData) => TResource | (TResource & { id: undefined })
): (
  formData: TFormData
) => Effect.Effect<
  WithId<TResource>,
  ClinicalDataRepositoryErrors | NoSelectedOrgError,
  ClinicalDataRepositoryService
> {
  return (
    formData: TFormData
  ): Effect.Effect<
    WithId<TResource>,
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
  TResource extends { id?: string; resourceType: string } & Schema.Schema.Type<
    (typeof Schemas)[keyof typeof Schemas]
  >,
>(
  resourceType: TResource['resourceType'],
  transform: (data: TFormData) => Omit<TResource, 'id'>
): (
  id: NonNullable<TResource['id']>,
  current: TResource,
  formData: TFormData
) => Effect.Effect<
  TResource,
  ClinicalDataRepositoryErrorsWithNotFound<TResource> | NoSelectedOrgError,
  ClinicalDataRepositoryService
> {
  return (
    id: NonNullable<TResource['id']>,
    current: TResource,
    formData: TFormData
  ): Effect.Effect<
    TResource,
    ClinicalDataRepositoryErrorsWithNotFound<TResource> | NoSelectedOrgError,
    ClinicalDataRepositoryService
  > => {
    return Effect.gen(function* () {
      const service: ClinicalDataRepositoryService =
        yield* ClinicalDataRepositoryService
      const repo = yield* service.repositoryEffect(resourceType)
      const updatedFields = transform(formData)
      const updated: WithId<TResource> = {
        ...current,
        ...updatedFields,
        id,
      }
      return yield* repo.update(updated)
    })
  }
}
