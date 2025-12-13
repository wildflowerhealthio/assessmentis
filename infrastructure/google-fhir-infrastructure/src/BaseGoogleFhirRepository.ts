import { Effect, Schema, Option } from 'effect'
import {
  Element,
  BaseClinicalDataRepository,
  WithId,
  Bundle,
  hasId,
  assertId,
} from '@assessmentis/clinical-domain/general-purpose'
import {
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
  ExternalAssertionError,
} from '@assessmentis/clinical-domain/errors'
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
  TResource extends Element<TId>,
  TResourceEncoded extends { resourceType: string; id?: string | undefined },
  TId extends string,
> extends BaseClinicalDataRepository<TResource, TId> {
  protected readonly resourceType: string
  protected readonly schema: Schema.Schema<TResource, TResourceEncoded, never>
  protected readonly parent: string

  constructor(
    resourceType: string,
    schema: Schema.Schema<TResource, TResourceEncoded, never>,
    config: BaseConfig
  ) {
    super()
    this.resourceType = resourceType
    this.schema = schema
    this.parent = `projects/${config.projectId}/locations/${config.region}/datasets/${config.dataset}/fhirStores/${config.storeId}`
  }

  /**
   * Extract status code from an error response
   */
  protected getStatus(resp: unknown): number | undefined {
    return Schema.decodeUnknownOption(Schema.Struct({ status: Schema.Number }))(
      resp
    ).pipe(Option.getOrElse(() => ({ status: undefined }))).status
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

      if (this.getStatus(err.cause) == 401) {
        return new NeedsAuthenticationError({ cause: err })
      }
      return new UnhandledError({ cause: err })
    })
  }

  /**
   * Handle 404/410 errors by converting them to NotFoundError
   */
  protected handleNotFoundErrors(
    id: string
  ): (err: unknown) => NotFoundError | unknown {
    return (err: unknown) => {
      const status = this.getStatus((err as { cause?: unknown }).cause)

      if (status == 404 || status == 410) {
        return new NotFoundError({
          resourceType: this.resourceType,
          params: { id },
          cause: err,
        })
      }
      return err
    }
  }

  /**
   * Decode and assert resource has ID
   */
  protected decodeAndAssertId(
    response: gapi.client.Response<gapi.client.healthcare.HttpBody>,
    expectedMessage: string
  ) {
    const decode = Schema.decodeUnknown(this.schema)

    return Effect.gen(
      function* (
        this: BaseGoogleFhirRepository<TResource, TResourceEncoded, TId>
      ) {
        const decoded = yield* decode(response.result).pipe(
          Effect.mapError(
            (cause) =>
              new ExternalAssertionError({
                expected: expectedMessage,
                cause,
              })
          )
        )

        const resourceWithId: WithId<TResource> = yield* assertId(decoded).pipe(
          Effect.mapError(
            (cause) =>
              new ExternalAssertionError({
                expected: 'Resource to have id',
                cause,
              })
          )
        )

        return resourceWithId
      }.bind(this)
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
    return Effect.gen(
      function* (
        this: BaseGoogleFhirRepository<TResource, TResourceEncoded, TId>
      ) {
        yield* this.gapiPoll()

        const response = yield* Effect.tryPromise(() =>
          gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.read(
            {
              name: `${this.parent}/fhir/${this.resourceType}/${id}`,
            }
          )
        ).pipe(
          Effect.mapError(this.handleNotFoundErrors(id)),
          this.handleFhirApiErrors()
        )

        return yield* this.decodeAndAssertId(
          response,
          'Expected resource to conform to schema'
        )
      }.bind(this)
    ) as Effect.Effect<
      WithId<TResource>,
      | UnhandledError
      | NeedsAuthenticationError
      | ExternalAssertionError
      | NotFoundError,
      never
    >
  }

  getMany(
    _params: unknown
  ): Effect.Effect<
    WithId<TResource>[],
    UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
    never
  > {
    const DataBundle = Bundle(this.schema)
    const decodeBundle = Schema.decodeUnknown(DataBundle)

    return Effect.gen(
      function* (
        this: BaseGoogleFhirRepository<TResource, TResourceEncoded, TId>
      ) {
        yield* this.gapiPoll()

        const response = yield* Effect.tryPromise(() =>
          gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.search(
            {
              parent: this.parent,
              resource: {
                resourceType: this.resourceType,
              } as gapi.client.healthcare.HttpBody,
            }
          )
        ).pipe(this.handleFhirApiErrors<never>())

        const { entry } = yield* decodeBundle(response.result).pipe(
          Effect.mapError(
            (cause) =>
              new ExternalAssertionError({
                cause,
                expected: 'Search response could not be decoded',
              })
          )
        )

        if (entry == undefined) {
          return []
        } else {
          return entry
            .map((q): (TResource & { id: string }) | undefined => {
              const res = q.resource
              if (res != undefined && hasId(res)) {
                return res
              }
              return undefined
            })
            .filter((q) => q != undefined)
        }
      }.bind(this)
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

    return Effect.gen(
      function* (
        this: BaseGoogleFhirRepository<TResource, TResourceEncoded, TId>
      ) {
        const resourceData = yield* encode(resource).pipe(
          Effect.mapError((cause) => new UnhandledError({ cause }))
        )

        yield* this.gapiPoll()

        const response = yield* Effect.tryPromise(() =>
          gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.create(
            {
              parent: this.parent,
              type: this.resourceType,
              resource: resourceData as gapi.client.healthcare.HttpBody,
            }
          )
        ).pipe(this.handleFhirApiErrors<never>())

        return yield* this.decodeAndAssertId(
          response,
          'Created resource to conform to schema'
        )
      }.bind(this)
    ) as Effect.Effect<
      WithId<TResource>,
      UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
      never
    >
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

    return Effect.gen(
      function* (
        this: BaseGoogleFhirRepository<TResource, TResourceEncoded, TId>
      ) {
        const resourceData = yield* encode(resource).pipe(
          Effect.mapError((cause) => new UnhandledError({ cause }))
        )

        yield* this.gapiPoll()

        const response = yield* Effect.tryPromise(() =>
          gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.update(
            {
              name: `${this.parent}/fhir/${this.resourceType}/${resource.id}`,
              resource: resourceData as gapi.client.healthcare.HttpBody,
            }
          )
        ).pipe(
          Effect.mapError(this.handleNotFoundErrors(resource.id)),
          this.handleFhirApiErrors()
        )

        return yield* this.decodeAndAssertId(
          response,
          'Expected resource to conform to schema'
        )
      }.bind(this)
    ) as Effect.Effect<
      WithId<TResource>,
      | UnhandledError
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError,
      never
    >
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
    return Effect.gen(
      function* (
        this: BaseGoogleFhirRepository<TResource, TResourceEncoded, TId>
      ) {
        yield* this.gapiPoll()

        const response = yield* Effect.tryPromise(() =>
          gapi.client.healthcare.projects.locations.datasets.fhirStores.fhir.delete(
            {
              name: `${this.parent}/fhir/${this.resourceType}/${id}`,
            }
          )
        ).pipe(
          Effect.mapError(this.handleNotFoundErrors(id)),
          this.handleFhirApiErrors()
        )

        console.log('Delete response:', response)

        return {}
      }.bind(this)
    ) as Effect.Effect<
      object,
      | UnhandledError
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError,
      never
    >
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
        ).pipe(this.handleFhirApiErrors<never>())

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
          encodedResources.map((resource, idx) => ({
            ...resource,
            id: ids[idx],
          }))
        ).pipe(
          Effect.mapError(
            (cause) =>
              new ExternalAssertionError({
                expected: 'Response should be an array of resources',
                cause,
              })
          )
        )
        return updated as WithId<TResource>[]
      }.bind(this)
    )
  }
}
