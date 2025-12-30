import { Effect, Context } from 'effect'

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
  TResource,
  TError,
  TRepo extends Context.Tag<any, any>,
  TRequirements = TRepo,
>(
  repository: TRepo,
  transform: (data: TFormData) => TResource | Omit<TResource, 'id'>
): (formData: TFormData) => Effect.Effect<TResource, TError, TRequirements> {
  return (
    formData: TFormData
  ): Effect.Effect<TResource, TError, TRequirements> => {
    return Effect.gen(function* () {
      const repo = yield* repository
      const resource = transform(formData)
      return yield* repo.create(resource)
    }) as Effect.Effect<TResource, TError, TRequirements>
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
  TResource,
  TId,
  TError,
  TRepo extends Context.Tag<any, any>,
  TRequirements = TRepo,
>(
  repository: TRepo,
  transform: (data: TFormData) => TResource | Omit<TResource, 'id'>
): (
  id: TId,
  current: TResource,
  formData: TFormData
) => Effect.Effect<TResource, TError, TRequirements> {
  return (
    id: TId,
    current: TResource,
    formData: TFormData
  ): Effect.Effect<TResource, TError, TRequirements> => {
    return Effect.gen(function* () {
      const repo = yield* repository
      const updatedFields = transform(formData)
      const updated = {
        ...current,
        ...updatedFields,
        id,
      }
      return yield* repo.update(updated)
    }) as Effect.Effect<TResource, TError, TRequirements>
  }
}
