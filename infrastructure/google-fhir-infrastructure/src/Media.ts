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

  return repository.createLayer(
    MediaRepository,
    ({ getById, getAll, create, update, deleteById }) => ({
      getMedia: getById,
      getAllMedia: getAll,
      createMedia: create,
      updateMedia: update,
      deleteMedia: deleteById,
    })
  )
}
