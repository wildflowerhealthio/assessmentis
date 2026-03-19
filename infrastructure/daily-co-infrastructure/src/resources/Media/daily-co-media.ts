import { Effect, ParseResult, Schema } from 'effect'

import { Media } from '@assessmentis/clinical-domain'
import type { MediaEncoded } from '@assessmentis/clinical-domain'

/**
 * A single Daily.co recording entry enriched with its signed download link
 * and resource URL. The resolver fetches both pieces before decoding through
 * this schema.
 */
export const DailyCoRecordingInput = Schema.Struct({
  downloadLink: Schema.String,
  duration: Schema.Number,
  id: Schema.String,
  resourceUrl: Schema.String,
  start_ts: Schema.Number,
})

/**
 * Schema that transforms a Daily.co recording (with download link) into
 * a clinical-domain Media resource.
 *
 * Pipeline: DailyCoRecordingInput.Encoded → DailyCoRecordingInput.Type → MediaEncoded → Media
 */
export const DailyCoMedia: Schema.Schema<Media, typeof DailyCoRecordingInput.Encoded> =
  Schema.transformOrFail(DailyCoRecordingInput, Media, {
    decode: (rec) =>
      Effect.succeed<MediaEncoded>({
        domainType: 'Media',
        status: 'completed',
        identifier: [{ value: rec.id }],
        createdDateTime: new Date(rec.start_ts * 1000).toISOString(),
        duration: rec.duration,
        content: { dataUrl: rec.downloadLink },
        url: rec.resourceUrl,
      }),
    encode: (_, _opts, ast) =>
      Effect.fail(new ParseResult.Type(ast, _, 'DailyCoMedia is decode-only')),
    strict: true,
  })
