import { Either, Option, Schema, Stream } from 'effect'
import { useMemo } from 'react'

import type { ResourceDataTypes } from '@assessmentis/clinical-domain'
import {
  ReadonlyUrl,
  type Resource,
  type ResourceRequest,
} from '@assessmentis/effectful-store'
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
 * @returns Stream of Either<Resource, Error> that updates when the resource changes
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
export function useResourceSubscription<
  TDomainType extends keyof ResourceDataTypes,
>(
  ResourceSchema: {
    readonly DomainType: TDomainType
  },
  rawUrl: string
): Stream.Stream<
  Either.Either<
    Resource.WithResourceUrl<ResourceDataTypes[TDomainType]>,
    | ResourceRequest.CommonErrors
    | NotFoundError<
        ResourceDataTypes[TDomainType]['domainType'],
        {
          readonly url: string | ReadonlyUrl
        }
      >
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
      return hub.subscribe(ResourceSchema.DomainType, urlOption.value)
    }

    return Stream.succeed(
      Either.left(
        new NotFoundError<
          ResourceDataTypes[TDomainType]['domainType'],
          { url: string | ReadonlyUrl }
        >({
          resourceType: ResourceSchema.DomainType,
          params: { url: rawUrl },
        } as const)
      )
    )
  }, [rawUrl, ResourceSchema.DomainType, hub])
}
