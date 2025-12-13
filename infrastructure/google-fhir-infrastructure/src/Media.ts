import { Layer } from 'effect'
import {
  Media,
  MediaRepository,
  MediaId,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { MediaConfig } from '@assessmentis/config-domain/googleFhir'
import { BaseGoogleFhirRepository } from './BaseGoogleFhirRepository'

class MediaGoogleFhirRepository extends BaseGoogleFhirRepository<
  typeof Media.Type,
  typeof Media.Encoded,
  MediaId
> {
  constructor(config: MediaConfig) {
    super('Media', Media, config)
  }
}

export const Repository = (config: MediaConfig) => {
  const repository = new MediaGoogleFhirRepository(config)

  return Layer.succeed(MediaRepository, {
    getMedia: repository.get.bind(repository),
    getAllMedia: repository.getMany.bind(repository),
    createMedia: repository.create.bind(repository),
    updateMedia: repository.update.bind(repository),
    deleteMedia: repository.delete.bind(repository),
  })
}
