import { Context } from 'effect'
import { Media, MediaId } from '../resources/Media'
import { BaseClinicalDataRepository } from '../../assessmentis/contexts/ClinicalDataRepository'
export class MediaRepository extends Context.Tag('MediaRepository')<
  MediaRepository,
  BaseClinicalDataRepository<Media, MediaId>
>() {}
