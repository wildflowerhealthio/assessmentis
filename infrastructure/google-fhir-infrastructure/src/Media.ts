import { Layer, Effect } from 'effect'
import {
  Media,
  MediaRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { MediaConfig } from '@assessmentis/config-domain/googleFhir'

import * as Base from './Base'

export const Repository = (config: MediaConfig) =>
  Layer.effect(
    MediaRepository,
    Effect.gen(function* () {
      const { getAll, create, getById, deleteById, update } =
        yield* Base.BaseGoogleFhirStoreClient

      const createMedia: typeof MediaRepository.Service.createMedia = create(
        'Media',
        Media
      )

      const getMedia: typeof MediaRepository.Service.getMedia = getById(
        'Media',
        Media
      )

      const getAllMedia: typeof MediaRepository.Service.getAllMedia = getAll(
        'Media',
        Media
      )

      const updateMedia: typeof MediaRepository.Service.updateMedia = update(
        'Media',
        Media
      )

      const deleteMedia: typeof MediaRepository.Service.deleteMedia =
        deleteById('Media', Media)

      return {
        getMedia,
        createMedia,
        updateMedia,
        getAllMedia,
        deleteMedia,
      }
    })
  ).pipe(Layer.provide(Base.LiveClient(config)))
