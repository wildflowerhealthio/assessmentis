import { Effect, Schema, Option, Schedule } from 'effect'
import {
  Element,
  WithId,
  hasId,
  assertId,
} from '@assessmentis/clinical-domain/data-types'
import { BaseClinicalDataRepository } from '@assessmentis/clinical-domain'
import { Bundle } from '@assessmentis/clinical-domain/foundation-framework'
import {
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
  ExternalAssertionError,
} from '@assessmentis/ontology'
import { BaseConfig } from '@assessmentis/config-domain/googleFhir'
import { UnknownException } from 'effect/Cause'

/**
 * Base class for Google FHIR repository implementations.
 * Extends BaseClinicalDataRepository and provides concrete implementations
 * for CRUD operations using the Google FHIR Store client.
 *
 * @template TResource - The resource domain type
 * @template TResourceEncoded - The encoded resource type for the schema
 * @template TId - The resource ID type
 *
 * @example
 * ```typescript
 * export class QuestionnaireGoogleFhirRepository extends BaseGoogleFhirRepository<
 *   typeof Questionnaire.Type,
 *   typeof Questionnaire.Encoded,
 *   QuestionnaireId
 * > {
 *   constructor(config: QuestionnaireConfig) {
 *     super('Questionnaire', Questionnaire, config)
 *   }
 * }
 * ```
 */
export abstract class BaseGoogleFhirRepository<
  TResource extends Element<TId> & { resourceType: string },
  TResourceEncoded extends { resourceType: string; id?: string | undefined },
  TId extends string,
> extends BaseClinicalDataRepository<TResource, TId> {
  protected readonly resourceType: TResource['resourceType']
  protected readonly schema: Schema.Schema<TResource, TResourceEncoded, never>
  protected readonly parent: string

  constructor(
    resourceType: TResource['resourceType'],
    schema: Schema.Schema<TResource, TResourceEncoded, never>,
    config: BaseConfig
  ) {
    super()
    this.resourceType = resourceType
    this.schema = schema
    this.parent = `projects/${config.projectId}/locations/${config.region}/datasets/${config.dataset}/fhirStores/${config.storeId}`
  }

  /**
   * Poll for gapi healthcare client availability
   */
  protected gapiPoll(): Effect.Effect<void, NeedsAuthenticationError, never> {
    return Effect.gen(function* () {
      let polls = 0
      while (
        window?.gapi?.client?.healthcare?.projects?.locations?.datasets
          ?.fhirStores?.fhir == undefined ||
        window?.gapi?.client?.getToken().access_token == undefined
      ) {
        console.log('Polling for gapi healthcare client availability...')
        yield* Effect.sleep('100 millis')
        polls += 1
        if (polls > 20) {
          return yield* Effect.fail(
            new NeedsAuthenticationError({
              cause:
                'Polled for two seconds and never found gapi?.client?.healthcare?.projects?.locations?.datasets?.fhirStores?.fhir',
            })
          )
        }
      }
      return
    })
  }

  /**
   * Handle common FHIR API errors
   */
  protected handleFhirApiErrors<OtherErrors>(): (
    _: Effect.Effect<
      gapi.client.Response<gapi.client.healthcare.HttpBody>,
      OtherErrors | UnknownException,
      never
    >
  ) => Effect.Effect<
    gapi.client.Response<gapi.client.healthcare.HttpBody>,
    OtherErrors | NeedsAuthenticationError | UnhandledError,
    never
  > {
    return Effect.mapError((err: OtherErrors | UnknownException) => {
      if (!(err instanceof UnknownException)) return err

      if (getStatus(err.cause) == 401) {
        return new NeedsAuthenticationError({ cause: err })
      }
      return new UnhandledError({ cause: err })
    })
  }

  /**
   * Handle 404/410 errors by converting them to NotFoundError
   */
  protected handleNotFoundErrors<T>(
    findBy: object
  ): (err: T) => NotFoundError | T {
    const resourceType = this.resourceType
    return (err: T) => {
      const status = getStatus((err as { cause?: unknown }).cause)
      if (status == 404 || status == 410) {
        return new NotFoundError({
          resourceType,
          params: findBy,
          cause: err,
        })
      }
      return err
    }
  }

  /**
   * Decode and assert resource has ID
   */
  protected decodeAndAssertId(): (
    response: gapi.client.Response<gapi.client.healthcare.HttpBody>
  ) => Effect.Effect<WithId<TResource>, ExternalAssertionError, never> {
    const decode = Schema.decodeUnknown(this.schema)

    return (response) => {
      return Effect.gen(function* (
        this: BaseGoogleFhirRepository<TResource, TResourceEncoded, TId>
      ) {
        const decoded = yield* decode(response.result).pipe(
          Effect.mapError(
            (cause) =>
              new ExternalAssertionError({
                expected: 'Expected resource to conform to schema',
                cause,
              })
          )
        )

        const resourceWithId: WithId<TResource> = yield* assertId(decoded).pipe(
          Effect.mapError(
            (cause) =>
              new ExternalAssertionError({
                expected: 'Expected resource to have id',
                cause,
              })
          )
        )

        return resourceWithId
      })
    }
  }

  protected doFhirApiCall<Args extends object>(
    fhirApiCall: () => (
      args: Args
    ) => Promise<gapi.client.Response<gapi.client.healthcare.HttpBody>>,
    args: Args
  ): Effect.Effect<
    gapi.client.Response<gapi.client.healthcare.HttpBody>,
    UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
    never
  > {
    return this.gapiPoll().pipe(
      Effect.flatMap(() =>
        Effect.retry(
          Effect.tryPromise(() => fhirApiCall()(args)),
          {
            until: (err) => {
              console.error('FHIR API call error:', err)
              return getStatus(err.cause) != 502
            },
            times: 3,
            schedule: Schedule.exponential('500 millis', 2),
          }
        ).pipe(this.handleFhirApiErrors<ExternalAssertionError>().bind(this))
      )
    )
  }

  protected doFhirApiCallWith404<Args extends object>(
    fhirApiCall: () => (
      args: Args
    ) => Promise<gapi.client.Response<gapi.client.healthcare.HttpBody>>,
    args: Args,
    findBy: object
  ): Effect.Effect<
    gapi.client.Response<gapi.client.healthcare.HttpBody>,
    | UnhandledError
    | NeedsAuthenticationError
    | ExternalAssertionError
    | NotFoundError,
    never
  > {
    return this.doFhirApiCall(fhirApiCall, args).pipe(
      Effect.mapError(
        this.handleNotFoundErrors<
          ExternalAssertionError | NeedsAuthenticationError | UnhandledError
        >(findBy)
      )
    )
  }

  get(
    id: TId
  ): Effect.Effect<
    WithId<TResource>,
    | UnhandledError
    | NeedsAuthenticationError
    | ExternalAssertionError
    | NotFoundError,
    never
  > {
    return this.doFhirApiCallWith404(
      () =>
        gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.read,
      {
        name: `${this.parent}/fhir/${this.resourceType}/${id}`,
      },
      {
        id,
        resourceType: this.resourceType,
      }
    ).pipe(Effect.flatMap(this.decodeAndAssertId()))
  }

  getMany(
    params = {}
  ): Effect.Effect<
    WithId<TResource>[],
    UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
    never
  > {
    const DataBundle = Bundle(this.schema)
    const decodeBundle = Schema.decodeUnknown(DataBundle)

    return this.doFhirApiCall(
      () =>
        gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir
          .search,
      {
        parent: this.parent,
        resourceType: this.resourceType,
        resource: {
          ...params,
        } as gapi.client.healthcare.HttpBody,
      }
    ).pipe(
      Effect.flatMap((response) =>
        decodeBundle(response.result).pipe(
          Effect.mapError(
            (cause) =>
              new ExternalAssertionError({
                cause,
                expected: 'Search response could not be decoded',
              })
          )
        )
      ),
      Effect.map(({ entry }) => {
        if (entry == undefined) {
          return []
        } else {
          return entry
            .map((q): WithId<TResource> | undefined => {
              const res = q.resource
              if (res != undefined && hasId(res)) {
                return res
              }
              return undefined
            })
            .filter((q): q is WithId<TResource> => q != undefined)
        }
      })
    )
  }

  create(
    resource: TResource
  ): Effect.Effect<
    WithId<TResource>,
    UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
    never
  > {
    const encode = Schema.encode(this.schema)

    return encode(resource)
      .pipe(Effect.mapError((cause) => new UnhandledError({ cause })))
      .pipe(
        Effect.flatMap((resourceData) =>
          this.doFhirApiCall(
            () =>
              gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir
                .create,
            {
              parent: this.parent,
              type: this.resourceType,
              resource: resourceData as gapi.client.healthcare.HttpBody,
            }
          )
        ),
        Effect.flatMap(this.decodeAndAssertId())
      )
  }

  update(
    resource: WithId<TResource>
  ): Effect.Effect<
    WithId<TResource>,
    | UnhandledError
    | NotFoundError
    | NeedsAuthenticationError
    | ExternalAssertionError,
    never
  > {
    const encode = Schema.encode(this.schema)

    return encode(resource).pipe(
      Effect.mapError((cause) => new UnhandledError({ cause })),
      Effect.flatMap((resourceData) =>
        this.doFhirApiCallWith404(
          () =>
            gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir
              .update,
          {
            name: `${this.parent}/fhir/${this.resourceType}/${resource.id}`,
            resource: resourceData as gapi.client.healthcare.HttpBody,
          },
          {
            id: resource.id,
            resourceType: this.resourceType,
          }
        )
      ),
      Effect.flatMap(this.decodeAndAssertId())
    )
  }

  delete(
    id: TId
  ): Effect.Effect<
    object,
    | UnhandledError
    | NotFoundError
    | NeedsAuthenticationError
    | ExternalAssertionError,
    never
  > {
    return this.doFhirApiCallWith404(
      () =>
        gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir
          .delete,
      {
        name: `${this.parent}/fhir/${this.resourceType}/${id}`,
      },
      { id, resourceType: this.resourceType }
    ).pipe(Effect.map(() => ({})))
  }

  /**
   * Helper method for creating multiple resources using a FHIR bundle transaction.
   * Can be used for batch creation operations.
   */
  createMany(
    resources: ReadonlyArray<TResource>
  ): Effect.Effect<
    ReadonlyArray<WithId<TResource>>,
    UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
    never
  > {
    const TransactionResponseBundle = Bundle(
      Schema.Struct({
        request: Schema.Struct({
          etag: Schema.String,
          lastModified: Schema.String,
          location: Schema.String,
          status: Schema.String,
        }),
      })
    )

    return Effect.gen(
      function* (
        this: BaseGoogleFhirRepository<TResource, TResourceEncoded, TId>
      ) {
        const resourceArraySchema = Schema.Array(this.schema)
        const encodedResources = yield* Schema.encode(resourceArraySchema)(
          resources
        ).pipe(Effect.mapError((cause) => new UnhandledError({ cause })))
        const resource = {
          resourceType: 'Bundle',
          type: 'transaction',
          entry: encodedResources.map((resource) => ({
            resource,
            request: {
              method: 'POST',
              url: resource.resourceType,
            } as const,
          })),
        }

        yield* this.gapiPoll()
        const response = yield* Effect.tryPromise(() =>
          gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.executeBundle(
            {
              parent: this.parent,
              resource: resource as gapi.client.healthcare.HttpBody,
            }
          )
        ).pipe(this.handleFhirApiErrors<UnhandledError>())

        const responseBundle = yield* Schema.decodeUnknown(
          TransactionResponseBundle
        )(response.result).pipe(
          Effect.mapError(
            (cause) =>
              new ExternalAssertionError({
                expected: 'Response should be an transaction response bundle',
                cause,
              })
          )
        )

        if (responseBundle.entry == undefined) {
          return yield* Effect.fail(
            new ExternalAssertionError({
              cause: undefined,
              expected: 'Expected transaction response bundle to have entries',
            })
          )
        }

        const ids = yield* Effect.all(
          responseBundle.entry.map((entry) => {
            if (typeof entry?.response?.location != 'string') {
              return Effect.fail(
                new ExternalAssertionError({
                  expected:
                    'Expected entry in transaction response bundle to have a location URL',
                  cause: undefined,
                })
              )
            }
            const locationParts = entry.response.location.split('/')
            if (locationParts.length < 15) {
              return Effect.fail(
                new ExternalAssertionError({
                  cause: undefined,
                  expected:
                    'Expected entry in transaction response bundle to have a location URL shaped like `https://healthcare.googleapis.com/v1/projects/PROJECT_ID/locations/REGION/datasets/REGION/fhirStores/FHIR_STORE_ID/fhir/Patient/PATIENT_ID/_history/HISTORY_ID`',
                })
              )
            }

            return Effect.succeed(locationParts[14])
          })
        )

        const updated = yield* Schema.decode(resourceArraySchema)(
          encodedResources.map(
            (resource, idx): WithId<TResourceEncoded> => ({
              ...resource,
              id: ids[idx],
            })
          )
        ).pipe(
          Effect.mapError(
            (cause) =>
              new ExternalAssertionError({
                expected: 'Response should be an array of resources',
                cause,
              })
          )
        )

        return updated
          .map((res): WithId<TResource> | undefined => {
            if (res != undefined && hasId(res)) {
              return res
            }
            return undefined
          })
          .filter((q): q is WithId<TResource> => q != undefined)
      }.bind(this)
    )
  }
}

/**
 * Extract status code from an error response
 */
const getStatus = (resp: unknown): number | undefined => {
  return Schema.decodeUnknownOption(Schema.Struct({ status: Schema.Number }))(
    resp
  ).pipe(Option.getOrElse(() => ({ status: undefined }))).status
}
