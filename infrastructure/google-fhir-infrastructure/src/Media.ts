import {
  Media,
  MediaRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { MediaConfig } from '@assessmentis/config-domain/googleFhir'
import { createStandardRepository } from './BaseGoogleFhirRepository'

export const Repository = (config: MediaConfig) =>
  createStandardRepository(
    MediaRepository,
    'Media',
    Media,
    config,
    ({ getById, getAll, create, update, deleteById }) => ({
      getMedia: getById,
      getAllMedia: getAll,
      createMedia: create,
      updateMedia: update,
      deleteMedia: deleteById,
    })
  )
