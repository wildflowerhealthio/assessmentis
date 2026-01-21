import { Context } from 'effect'
import { Media } from '../resources/Media'
import { ClinicalDataRepository } from '../../types'
export class MediaRepository extends Context.Tag('MediaRepository')<
  MediaRepository,
  ClinicalDataRepository<Media>
>() {}
