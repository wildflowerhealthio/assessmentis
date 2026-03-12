import { Context, Effect, Either, Layer, Schema } from 'effect'

import { BadDataError, NotFoundError } from '@assessmentis/ontology'
import {
  CurrentOrg,
  DocumentStore,
  Org,
  type OrgSlug,
} from '@assessmentis/platform-domain'

/**
 * Effect context tag carrying the resolved {@link Org} instance for the
 * current request or session.
 *
 * @remarks
 * Used on the server side (Cloud Functions) after auth validation. Domain
 * code depends on this tag to access the active org without passing it as
 * a parameter.
 *
 * @see {@link LoadedOrgLayer} for the standard DocumentStore-backed provider
 * @see {@link LiteralLoadedOrgLayer} for test/literal construction
 */
export class LoadedOrg extends Context.Tag('LoadedOrg')<LoadedOrg, Org>() {}

const decodeOrg = (orgSlug: OrgSlug, data: unknown | undefined) =>
  Effect.gen(function* () {
    if (data == undefined) {
      return yield* Effect.fail(
        new NotFoundError<'Org', { orgSlug: OrgSlug }>({
          resourceType: 'Org',
          params: { orgSlug },
        })
      )
    }
    return yield* Schema.decodeUnknownEither(Org)(data).pipe(
      Either.mapLeft(
        (cause) =>
          new BadDataError({
            message: `Error decoding org`,
            cause,
          })
      )
    )
  })

/**
 * Constructs a {@link LoadedOrg} layer from raw data, decoding it with the
 * {@link Org} schema. Useful in tests or when the org document is already
 * available.
 */
export const LiteralLoadedOrgLayer = (
  orgSlug: OrgSlug,
  data: unknown
): Layer.Layer<
  LoadedOrg,
  NotFoundError<'Org', { orgSlug: OrgSlug }> | BadDataError,
  never
> => Layer.effect(LoadedOrg, decodeOrg(orgSlug, data))

/**
 * Standard {@link LoadedOrg} layer that reads from {@link DocumentStore}
 * using the {@link CurrentOrg} slug.
 */
export const LoadedOrgLayer = Layer.effect(
  LoadedOrg,
  Effect.gen(function* () {
    const orgSlug = yield* CurrentOrg
    const documentStore = yield* DocumentStore

    const data = yield* documentStore.get('orgs', orgSlug).pipe(
      Effect.mapError((e) =>
        e instanceof NotFoundError
          ? new NotFoundError<'Org', { orgSlug: OrgSlug }>({
              resourceType: 'Org',
              params: { orgSlug },
              cause: e,
            })
          : e
      )
    )
    const org = yield* decodeOrg(orgSlug, data).pipe(
      Effect.mapError(
        (e) =>
          new BadDataError({
            message: `Unparseable data for org ${orgSlug}`,
            cause: e,
          })
      )
    )

    return org
  })
)
