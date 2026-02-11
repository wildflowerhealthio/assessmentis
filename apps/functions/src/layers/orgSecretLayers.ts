import type { OrgSlug } from '@assessmentis/platform-domain'
import {
  CurrentOrg,
  DocumentStore,
  LoadedDailyCoSecret,
  DailyCoSecret,
} from '@assessmentis/platform-domain'
import type { Context } from 'effect'
import { Effect, Layer, Schema } from 'effect'
import { BadDataError, NotFoundError } from '@assessmentis/ontology'

const makeOrgSecretLayer = <Label, A, E>(
  secretTag: Context.Tag<Label, A>,
  identifier: string,
  schema: Schema.Schema<A, E, never>
) =>
  Layer.effect(
    secretTag,
    Effect.gen(function* () {
      const currentOrg = yield* CurrentOrg
      const documentStore = yield* DocumentStore

      const data = yield* documentStore
        .get('orgs', currentOrg, 'secrets', identifier)
        .pipe(
          Effect.mapError((e) =>
            e instanceof NotFoundError
              ? new NotFoundError<
                  'OrgSecret',
                  { orgSlug: OrgSlug; secretId: string }
                >({
                  resourceType: 'OrgSecret',
                  params: { orgSlug: currentOrg, secretId: identifier },
                  cause: e,
                })
              : e
          )
        )

      const decode = Schema.decodeUnknown(schema)
      const res = decode(data).pipe(
        Effect.mapError(
          (cause) =>
            new BadDataError({
              message: `Error decoding secret ${identifier}`,
              cause,
            })
        )
      )
      return yield* res
    })
  )

export const DailyCoSecretLayerLive = makeOrgSecretLayer(
  LoadedDailyCoSecret,
  'dailyCo',
  DailyCoSecret
)
