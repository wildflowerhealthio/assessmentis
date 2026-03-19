import { Context, Effect, Either, Layer, Schema } from 'effect'

import { BadDataError, NotFoundError } from '@assessmentis/ontology'
import { CurrentOrg, DocumentStore, Org } from '@assessmentis/platform-domain'
import type { OrgSlug } from '@assessmentis/platform-domain'

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

const decodeOrg = (
  orgSlug: OrgSlug,
  data: unknown
): Effect.Effect<Org, NotFoundError<'Org', { orgSlug: OrgSlug }> | BadDataError> =>
  Effect.gen(function* decodeOrgGen() {
    if (data === undefined) {
      return yield* Effect.fail(
        new NotFoundError<'Org', { orgSlug: OrgSlug }>({
          params: { orgSlug },
          resourceType: 'Org',
        })
      )
    }
    return yield* Schema.decodeUnknownEither(Org)(data).pipe(
      Either.mapLeft(
        (cause) =>
          new BadDataError({
            cause,
            message: `Error decoding org`,
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
): Layer.Layer<LoadedOrg, NotFoundError<'Org', { orgSlug: OrgSlug }> | BadDataError> =>
  Layer.effect(LoadedOrg, decodeOrg(orgSlug, data))

/**
 * Standard {@link LoadedOrg} layer that reads from {@link DocumentStore}
 * using the {@link CurrentOrg} slug.
 */
export const LoadedOrgLayer = Layer.effect(
  LoadedOrg,
  Effect.gen(function* LoadedOrgLayer() {
    const orgSlug = yield* CurrentOrg
    const documentStore = yield* DocumentStore

    const data = yield* documentStore.get('orgs', orgSlug).pipe(
      Effect.mapError((e) => {
        if (e instanceof NotFoundError) {
          return new NotFoundError<'Org', { orgSlug: OrgSlug }>({
            cause: e,
            params: { orgSlug },
            resourceType: 'Org',
          })
        }
        return e
      })
    )
    const org = yield* decodeOrg(orgSlug, data).pipe(
      Effect.mapError(
        (e) =>
          new BadDataError({
            cause: e,
            message: `Unparseable data for org ${orgSlug}`,
          })
      )
    )

    return org
  })
)
