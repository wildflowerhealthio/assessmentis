import { expect, test, describe } from 'vitest'
import { Schema, Either } from 'effect'
import {
  BaseConfig,
  EncounterConfig,
  QuestionnaireConfig,
  QuestionnaireResponseConfig,
} from './index'

describe('GoogleFhir Config Schemas', () => {
  describe('BaseConfig', () => {
    test('encodes valid config correctly', () => {
      const encode = Schema.encodeUnknownEither(BaseConfig)
      const config = {
        _tag: 'google_fhir_store',
        projectId: 'test-project',
        region: 'us-central1',
        dataset: 'test-dataset',
        storeId: 'test-store',
      }

      const result = encode(config)

      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right).toEqual(config)
      }
    })

    test('decodes valid config correctly', () => {
      const decode = Schema.decodeUnknownEither(BaseConfig)
      const config = {
        _tag: 'google_fhir_store',
        projectId: 'test-project',
        region: 'us-central1',
        dataset: 'test-dataset',
        storeId: 'test-store',
      }

      const result = decode(config)

      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right).toEqual(config)
      }
    })

    test('fails to decode missing projectId', () => {
      const decode = Schema.decodeUnknownEither(BaseConfig)
      const config = {
        _tag: 'google_fhir_store',
        region: 'us-central1',
        dataset: 'test-dataset',
        storeId: 'test-store',
      }

      const result = decode(config)

      expect(Either.isLeft(result)).toBe(true)
    })

    test('fails to decode missing required fields', () => {
      const decode = Schema.decodeUnknownEither(BaseConfig)
      const config = {
        _tag: 'google_fhir_store',
      }

      const result = decode(config)

      expect(Either.isLeft(result)).toBe(true)
    })

    test('fails to decode incorrect tag', () => {
      const decode = Schema.decodeUnknownEither(BaseConfig)
      const config = {
        _tag: 'wrong_tag',
        projectId: 'test-project',
        region: 'us-central1',
        dataset: 'test-dataset',
        storeId: 'test-store',
      }

      const result = decode(config)

      expect(Either.isLeft(result)).toBe(true)
    })
  })

  describe('EncounterConfig', () => {
    test('is compatible with BaseConfig', () => {
      const encode = Schema.encodeUnknownEither(EncounterConfig)
      const config = {
        _tag: 'google_fhir_store',
        projectId: 'encounter-project',
        region: 'us-west1',
        dataset: 'encounter-dataset',
        storeId: 'encounter-store',
      }

      const result = encode(config)

      expect(Either.isRight(result)).toBe(true)
    })
  })

  describe('QuestionnaireConfig', () => {
    test('is compatible with BaseConfig', () => {
      const encode = Schema.encodeUnknownEither(QuestionnaireConfig)
      const config = {
        _tag: 'google_fhir_store',
        projectId: 'questionnaire-project',
        region: 'europe-west1',
        dataset: 'questionnaire-dataset',
        storeId: 'questionnaire-store',
      }

      const result = encode(config)

      expect(Either.isRight(result)).toBe(true)
    })
  })

  describe('QuestionnaireResponseConfig', () => {
    test('is compatible with BaseConfig', () => {
      const encode = Schema.encodeUnknownEither(QuestionnaireResponseConfig)
      const config = {
        _tag: 'google_fhir_store',
        projectId: 'response-project',
        region: 'asia-east1',
        dataset: 'response-dataset',
        storeId: 'response-store',
      }

      const result = encode(config)

      expect(Either.isRight(result)).toBe(true)
    })
  })
})
