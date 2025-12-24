import { expect, test, describe } from 'vitest'
import { Schema, Either } from 'effect'
import { Org, OrgLoading, OrgDataError, OrgError } from './Org'

describe('Org', () => {
  test('decodes valid org structure', () => {
    const decode = Schema.decodeUnknownEither(Org)
    const org = {
      slug: 'test-org',
      frontendConfig: {
        questionnaireRepository: {
          _tag: 'google_fhir_store',
          projectId: 'project-1',
          region: 'us-central1',
          dataset: 'questionnaires',
          storeId: 'store-1',
        },
        questionnaireResponseRepository: {
          _tag: 'google_fhir_store',
          projectId: 'project-1',
          region: 'us-central1',
          dataset: 'responses',
          storeId: 'store-2',
        },
        encounterRepository: {
          _tag: 'google_fhir_store',
          projectId: 'project-1',
          region: 'us-central1',
          dataset: 'encounters',
          storeId: 'store-3',
        },
        mediaRepository: {
          _tag: 'google_fhir_store',
          projectId: 'project-1',
          region: 'us-central1',
          dataset: 'media',
          storeId: 'store-4',
        },
        observationRepository: {
          _tag: 'google_fhir_store',
          projectId: 'project-1',
          region: 'us-central1',
          dataset: 'media',
          storeId: 'store-4',
        },
        compositionRepository: {
          _tag: 'google_fhir_store',
          projectId: 'project-1',
          region: 'us-central1',
          dataset: 'compositions',
          storeId: 'store-5',
        },
        patientRepository: {
          _tag: 'google_fhir_store',
          projectId: 'project-1',
          region: 'us-central1',
          dataset: 'patients',
          storeId: 'store-6',
        },
        practitionerRepository: {
          _tag: 'google_fhir_store',
          projectId: 'project-1',
          region: 'us-central1',
          dataset: 'practitioners',
          storeId: 'store-7',
        },
        videoCallClient: {
          _tag: 'daily_co_proxy',
          dailyCoProxyUrl: 'https://proxy.example.com',
        },
      },
    }

    const result = decode(org)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.slug).toBe('test-org')
      expect(result.right.frontendConfig.questionnaireRepository._tag).toBe(
        'google_fhir_store'
      )
      expect(result.right.frontendConfig.videoCallClient._tag).toBe(
        'daily_co_proxy'
      )
    }
  })

  test('accepts org with not_implemented repositories', () => {
    const decode = Schema.decodeUnknownEither(Org)
    const org: typeof Org.Encoded = {
      slug: 'minimal-org',
      frontendConfig: {
        questionnaireRepository: {
          _tag: 'not_implemented',
        },
        questionnaireResponseRepository: {
          _tag: 'not_implemented',
        },
        encounterRepository: {
          _tag: 'not_implemented',
        },
        mediaRepository: {
          _tag: 'not_implemented',
        },
        observationRepository: {
          _tag: 'not_implemented',
        },
        compositionRepository: {
          _tag: 'not_implemented',
        },
        patientRepository: {
          _tag: 'not_implemented',
        },
        practitionerRepository: {
          _tag: 'not_implemented',
        },
        videoCallClient: {
          _tag: 'not_implemented',
        },
      },
    }

    const result = decode(org)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.slug).toBe('minimal-org')
      expect(result.right.frontendConfig.questionnaireRepository._tag).toBe(
        'not_implemented'
      )
    }
  })

  test('accepts mixed implementation types', () => {
    const decode = Schema.decodeUnknownEither(Org)
    const org: typeof Org.Encoded = {
      slug: 'mixed-org',
      frontendConfig: {
        questionnaireRepository: {
          _tag: 'google_fhir_store',
          projectId: 'project-1',
          region: 'us-central1',
          dataset: 'questionnaires',
          storeId: 'store-1',
        },
        questionnaireResponseRepository: {
          _tag: 'not_implemented',
        },
        encounterRepository: {
          _tag: 'not_implemented',
        },
        mediaRepository: {
          _tag: 'not_implemented',
        },
        observationRepository: {
          _tag: 'not_implemented',
        },
        compositionRepository: {
          _tag: 'not_implemented',
        },
        patientRepository: {
          _tag: 'not_implemented',
        },
        practitionerRepository: {
          _tag: 'not_implemented',
        },
        videoCallClient: {
          _tag: 'daily_co_proxy',
          dailyCoProxyUrl: 'https://daily.example.com',
        },
      },
    }

    const result = decode(org)

    expect(Either.isRight(result)).toBe(true)
  })

  test('fails without slug', () => {
    const decode = Schema.decodeUnknownEither(Org)
    const org = {
      frontendConfig: {
        questionnaireRepository: { _tag: 'not_implemented' },
        questionnaireResponseRepository: { _tag: 'not_implemented' },
        encounterRepository: { _tag: 'not_implemented' },
        mediaRepository: { _tag: 'not_implemented' },
        compositionRepository: { _tag: 'not_implemented' },
        videoCallClient: { _tag: 'not_implemented' },
      },
    }

    const result = decode(org)

    expect(Either.isLeft(result)).toBe(true)
  })

  test('fails without frontendConfig', () => {
    const decode = Schema.decodeUnknownEither(Org)
    const org = {
      slug: 'test-org',
    }

    const result = decode(org)

    expect(Either.isLeft(result)).toBe(true)
  })

  test('fails with incomplete frontendConfig', () => {
    const decode = Schema.decodeUnknownEither(Org)
    const org = {
      slug: 'test-org',
      frontendConfig: {
        questionnaireRepository: { _tag: 'not_implemented' },
        // Missing other required fields
      },
    }

    const result = decode(org)

    expect(Either.isLeft(result)).toBe(true)
  })
})

describe('OrgLoading', () => {
  test('creates org loading state', () => {
    const encode = Schema.encodeUnknownEither(OrgLoading)
    const loading = {
      _tag: 'OrgLoading',
    }

    const result = encode(loading)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('OrgLoading')
    }
  })

  test('decodes org loading state', () => {
    const decode = Schema.decodeUnknownEither(OrgLoading)
    const loading = {
      _tag: 'OrgLoading',
    }

    const result = decode(loading)

    expect(Either.isRight(result)).toBe(true)
  })
})

describe('OrgDataError', () => {
  test('creates error with cause', () => {
    const encode = Schema.encodeUnknownEither(OrgDataError)
    const error = {
      _tag: 'OrgDataError',
      cause: 'Database query failed',
    }

    const result = encode(error)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('OrgDataError')
      expect(result.right.cause).toBe('Database query failed')
    }
  })

  test('creates error without cause', () => {
    const encode = Schema.encodeUnknownEither(OrgDataError)
    const error = {
      _tag: 'OrgDataError',
    }

    const result = encode(error)

    expect(Either.isRight(result)).toBe(true)
  })
})

describe('OrgError', () => {
  test('accepts OrgLoading', () => {
    const decode = Schema.decodeUnknownEither(OrgError)
    const error = {
      _tag: 'OrgLoading',
    }

    const result = decode(error)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('OrgLoading')
    }
  })

  test('accepts OrgDataError', () => {
    const decode = Schema.decodeUnknownEither(OrgError)
    const error = {
      _tag: 'OrgDataError',
      cause: 'Config error',
    }

    const result = decode(error)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('OrgDataError')
    }
  })

  test('accepts CurrentUserError types', () => {
    const decode = Schema.decodeUnknownEither(OrgError)
    const errors = [
      { _tag: 'UserLoading' },
      { _tag: 'UserDataError', cause: 'Error' },
      { _tag: 'AuthStateLoading' },
      { _tag: 'AuthStateError', cause: 'Auth failed' },
      { _tag: 'NotLoggedIn' },
    ]

    errors.forEach((error) => {
      const result = decode(error)
      expect(Either.isRight(result)).toBe(true)
    })
  })

  test('fails for invalid union member', () => {
    const decode = Schema.decodeUnknownEither(OrgError)
    const error = {
      _tag: 'InvalidOrgError',
    }

    const result = decode(error)

    expect(Either.isLeft(result)).toBe(true)
  })
})
