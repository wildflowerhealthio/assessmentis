import { Effect } from 'effect'
import type { WithId } from './Resource'

export const hasId = <T extends { id?: string | undefined }>(
  value: T
): value is WithId<T> => {
  return typeof value.id === 'string'
}

export const assertId = <A extends { id?: string | undefined }, E>(
  a: A,
  absentError: E
): Effect.Effect<WithId<A>, E, never> =>
  hasId(a) ? Effect.succeed(a) : Effect.fail(absentError)
