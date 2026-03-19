import { Effect, Layer } from 'effect'

import { CurrentOrg } from '@assessmentis/platform-domain'

import { UnhandledError } from '../../../../global/ontology/src/errors'
import { FunctionsContext } from '../tags/functions-context'

export const CurrentOrgLayerLive: Layer.Layer<CurrentOrg, UnhandledError, FunctionsContext> =
  Layer.effect(
    CurrentOrg,
    Effect.gen(function* CurrentOrgLayerLive() {
      const ctx = yield* FunctionsContext
      if (!ctx.orgSlug) {
        return yield* Effect.fail(
          new UnhandledError({
            message: 'Missing orgSlug for org-scoped function',
          })
        )
      }
      return ctx.orgSlug
    })
  )
