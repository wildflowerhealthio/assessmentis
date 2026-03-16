import { Either, Option, Schema, Stream } from 'effect'
import { useMemo } from 'react'

import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import type { Resource, ResourceRequest } from '@assessmentis/effectful-store'
import { NotFoundError } from '@assessmentis/ontology'

import { useHub } from './useHub'

/**
 * Hook for subscribing to a single resource by URL with automatic URL parsing.
 *
 * This hook combines URL decoding with Hub subscription in a type-safe way.
 * It automatically handles invalid URLs by emitting NotFoundError.
 *
 * @param ResourceSchema - The resource Schema class (e.g., Patient, Encounter)
 * @param rawUrl - The raw URL string from route params
 * @returns Stream of Either\<Resource, Error\> that updates when the resource changes
 *
 * @example
 * ```typescript
 * import { Patient } from '@assessmentis/clinical-domain'
 *
 * function PatientPage({ params }: { params: { patientId: string } }) {
 *   const patientStream = useResourceSubscription(Patient, params.patientId)
 *   const patientPromise = useEitherStream(patientStream)
 *
 *   return <Suspense><Await resolve={patientPromise}>...</Await></Suspense>
 * }
 * ```
 */
export function useResourceSubscription<K extends ClinicalDomainClasses>(
  ResourceSchema: K,
  rawUrl: string
): Stream.Stream<
  Either.Either<
    Resource.WithResourceUrl<InstanceType<K>>,
    | ResourceRequest.CommonErrors
    | NotFoundError<
        K['DomainType'],
        {
          readonly url: Resource.InferResourceUrl<InstanceType<K>>
        }
      >
    | NotFoundError<K['DomainType'], { readonly unparsableUrl: string }>
  >,
  never,
  never
> {
  const hub = useHub()

  return useMemo(() => {
    const urlOption = Schema.decodeOption<ReadonlyUrl, string>(
      ReadonlyUrl.FromString
    )(rawUrl)

    if (Option.isSome(urlOption)) {
      return hub.subscribe(ResourceSchema, urlOption.value)
    }

    return Stream.succeed(
      Either.left(
        new NotFoundError<K['DomainType'], { unparsableUrl: string }>({
          resourceType: ResourceSchema.DomainType,
          params: { unparsableUrl: rawUrl },
        } as const)
      )
    )
  }, [rawUrl, ResourceSchema, hub])
}
