import { Effect } from 'effect'
import { useState, useEffect } from 'react'
import { useRuntimeContext } from 'app/clientRuntime'
import { PickerItem } from '../types/PickerTypes'
import { BaseClinicalDataRepository } from '@assessmentis/clinical-domain'
import { ClientRuntimeContext } from '../../../../../../../../domain/platform-domain/src/PlatformService'

export interface UsePickerDataOptions<
  T extends { id?: string | undefined },
  TRepo extends BaseClinicalDataRepository<T, string>,
  O,
> {
  repository: Effect.Effect<TRepo, never, ClientRuntimeContext>
  transform: (item: T) => PickerItem<O>
  enabled?: boolean
}

export function usePickerData<
  T extends { id?: string | undefined },
  TRepo extends BaseClinicalDataRepository<T, string>,
  O,
>(
  options: UsePickerDataOptions<T, TRepo, O>
): {
  items: PickerItem<O>[]
  loading: boolean
  error: Error | null
  refetch: () => void
} {
  const { repository, transform, enabled = true } = options
  const runtime = useRuntimeContext()

  const [items, setItems] = useState<PickerItem<O>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await runtime.runPromise(
          Effect.gen(function* () {
            const repo = yield* repository
            return yield* repo.getMany()
          })
        )
        const transformed = data.map(transform)
        setItems(transformed)
      } catch (err) {
        if (err instanceof Error) {
          setError(err)
        } else {
          setError(new Error('An unknown error occurred', { cause: err }))
        }
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [repository, runtime, transform, enabled, refetchTrigger])

  const refetch = () => setRefetchTrigger((prev) => prev + 1)

  return { items, loading, error, refetch }
}
