import { Context, Effect, Either, Layer, Schema } from 'effect'
import type { OrgSlug } from '@assessmentis/platform-domain'
import { CurrentOrg, DocumentStore, Org } from '@assessmentis/platform-domain'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'

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
          new UnhandledError({
            message: `Error decoding org`,
            cause,
          })
      )
    )
  })

export const LiteralLoadedOrgLayer = (
  orgSlug: OrgSlug,
  data: unknown
): Layer.Layer<
  LoadedOrg,
  NotFoundError<'Org', { orgSlug: OrgSlug }> | UnhandledError,
  never
> => Layer.effect(LoadedOrg, decodeOrg(orgSlug, data))

export const LoadedOrgLayer = Layer.effect(
  LoadedOrg,
  Effect.gen(function* () {
    const orgSlug = yield* CurrentOrg
    const documentStore = yield* DocumentStore

    const data = yield* documentStore.get('orgs', orgSlug)
    const org = yield* decodeOrg(orgSlug, data)

    return org
  })
)
