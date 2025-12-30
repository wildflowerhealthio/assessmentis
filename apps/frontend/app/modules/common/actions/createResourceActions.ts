import { Effect, Context } from 'effect'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'

/**
 * Creates a generic create action for a resource
 *
 * This factory function reduces duplication across resource create actions by
 * encapsulating the common pattern of:
 * 1. Getting the repository from the Effect context
 * 2. Transforming form data to resource format
 * 3. Calling repository.create()
 *
 * Note: The return type uses `as Effect.Effect<any, any, any>` to work around
 * TypeScript's type inference limitations with Effect's contravariant requirements
 * parameter. This allows the returned actions to be used with ClientRuntimeContext
 * (which is a union of all repository types) without type errors. The runtime
 * behavior is still type-safe as the repository.create() method enforces the
 * correct types at runtime.
 *
 * @example
 * ```typescript
 * export const createPatient = createResourceCreateAction(
 *   PatientRepository,
 *   transformToPatient
 * )
 * ```
 */
export function createResourceCreateAction<
  TFormData,
  TResource,
  TRepo extends Context.Tag<any, any>,
>(repository: TRepo, transform: (data: TFormData) => TResource | Omit<TResource, 'id'>) {
  return (formData: TFormData) => {
    return Effect.gen(function* () {
      const repo = yield* repository
      const resource = transform(formData)
      return yield* repo.create(resource)
    }) as Effect.Effect<any, any, any>
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
 * Note: The return type uses `as Effect.Effect<any, any, any>` to work around
 * TypeScript's type inference limitations with Effect's contravariant requirements
 * parameter. This allows the returned actions to be used with ClientRuntimeContext
 * (which is a union of all repository types) without type errors. The runtime
 * behavior is still type-safe as the repository.update() method enforces the
 * correct types at runtime.
 *
 * @example
 * ```typescript
 * export const updatePatient = createResourceUpdateAction(
 *   PatientRepository,
 *   transformToPatient
 * )
 * ```
 */
export function createResourceUpdateAction<
  TFormData,
  TResource,
  TId,
  TRepo extends Context.Tag<any, any>,
>(repository: TRepo, transform: (data: TFormData) => TResource | Omit<TResource, 'id'>) {
  return (id: TId, current: TResource, formData: TFormData) => {
    return Effect.gen(function* () {
      const repo = yield* repository
      const updatedFields = transform(formData)
      const updated = {
        ...current,
        ...updatedFields,
        id,
      }
      return yield* repo.update(updated)
    }) as Effect.Effect<any, any, any>
  }
}
