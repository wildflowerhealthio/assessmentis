import { Effect, ParseResult, Schema } from 'effect'

import { Observation } from '@assessmentis/clinical-domain'
import type { ObservationEncoded } from '@assessmentis/clinical-domain'

/**
 * A single Daily.co transcript entry enriched with its access link
 * and resource URL. The resolver fetches the access link before decoding
 * through this schema.
 */
export const DailyCoTranscriptInput = Schema.Struct({
  transcriptId: Schema.String,
  accessLink: Schema.String,
  resourceUrl: Schema.String,
})

/**
 * Schema that transforms a Daily.co transcript (with access link) into
 * a clinical-domain Observation resource.
 *
 * Pipeline: DailyCoTranscriptInput.Encoded → DailyCoTranscriptInput.Type → ObservationEncoded → Observation
 */
export const DailyCoObservation: Schema.Schema<
  Observation,
  typeof DailyCoTranscriptInput.Encoded
> = Schema.transformOrFail(DailyCoTranscriptInput, Observation, {
  strict: true,
  decode: (transcript) =>
    Effect.succeed<ObservationEncoded>({
      domainType: 'Observation',
      status: 'final',
      code: {
        coding: [
          {
            system: 'http://assessment.is/fhir/observation-type',
            code: 'video-call-transcript',
            display: 'Video Call Transcript',
          },
        ],
      },
      value: {
        _tag: 'string',
        string: transcript.accessLink,
      },
      identifier: [
        {
          system: 'http://assessment.is/fhir/daily-co-transcript-id',
          value: transcript.transcriptId,
        },
      ],
      url: transcript.resourceUrl,
    }),
  encode: (_, _opts, ast) =>
    Effect.fail(
      new ParseResult.Type(ast, _, 'DailyCoObservation is decode-only')
    ),
})
