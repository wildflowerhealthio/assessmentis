import {
  CurrentOrg,
  DocumentStore,
  LoadedDailyCoSecret,
  DailyCoSecret,
} from '@assessmentis/platform-domain'
import { Context, Effect, Layer, Schema } from 'effect'
import { UnhandledError } from '@assessmentis/ontology'

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

      const data = yield* documentStore.get(
        'orgs',
        currentOrg,
        'secrets',
        identifier
      )

      const decode = Schema.decodeUnknown(schema)
      const res = decode(data).pipe(
        Effect.mapError(
          (cause) =>
            new UnhandledError({
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
  'dailyco',
  DailyCoSecret
)
