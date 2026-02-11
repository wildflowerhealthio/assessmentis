import { Context } from 'effect'
import type { Media } from '../resources/Media'
import type { ClinicalDataRepository } from '../../types'
export class MediaRepository extends Context.Tag('MediaRepository')<
  MediaRepository,
  ClinicalDataRepository<Media>
>() {}
