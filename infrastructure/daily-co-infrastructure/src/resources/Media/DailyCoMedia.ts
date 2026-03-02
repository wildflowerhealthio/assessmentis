import { Schema } from 'effect'
import type { MediaEncoded } from '@assessmentis/clinical-domain'
import { Media } from '@assessmentis/clinical-domain'

/**
 * A single Daily.co recording entry enriched with its signed download link
 * and resource URL. The resolver fetches both pieces before decoding through
 * this schema.
 */
export const DailyCoRecordingInput = Schema.Struct({
  id: Schema.String,
  start_ts: Schema.Number,
  duration: Schema.Number,
  downloadLink: Schema.String,
  resourceUrl: Schema.String,
})

/**
 * Schema that transforms a Daily.co recording (with download link) into
 * a clinical-domain Media resource.
 *
 * Pipeline: DailyCoRecordingInput.Encoded → DailyCoRecordingInput.Type → MediaEncoded → Media
 */
export const DailyCoMedia: Schema.Schema<
  Media,
  typeof DailyCoRecordingInput.Encoded
> = Schema.transform(DailyCoRecordingInput, Media, {
  strict: true,
  decode: (rec): MediaEncoded => ({
    domainType: 'Media',
    status: 'completed',
    identifier: [{ value: rec.id }],
    createdDateTime: new Date(rec.start_ts * 1000).toISOString(),
    duration: rec.duration,
    content: { dataUrl: rec.downloadLink },
    url: rec.resourceUrl,
  }),
  encode: () => {
    throw new Error('DailyCoMedia is decode-only')
  },
})
