import { Context, Data } from 'effect'
import { Media, MediaId } from '../resources/Media'
import { BaseClinicalDataRepository } from '../../assessmentis/contexts/ClinicalDataRepository'

export class MediaError extends Data.TaggedError('MediaError')<{
  message: string
  cause?: unknown
}> {}

export class MediaNotFound extends Data.TaggedError('MediaNotFound')<{
  mediaId?: MediaId
}> {}

export class MediaRepository extends Context.Tag('MediaRepository')<
  MediaRepository,
  BaseClinicalDataRepository<Media, MediaId>
>() {}
