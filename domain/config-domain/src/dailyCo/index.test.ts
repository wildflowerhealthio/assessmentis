import { expect, test, describe } from 'vitest'
import { Schema, Either } from 'effect'
import { DailyCoProxyConfig, RecordingsBucket } from './index'

describe('DailyCoProxyConfig', () => {
  test('encodes valid config correctly', () => {
    const encode = Schema.encodeUnknownEither(DailyCoProxyConfig)
    const config = {
      _tag: 'daily_co_proxy',
      dailyCoProxyUrl: 'https://proxy.example.com',
    }

    const result = encode(config)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right).toEqual(config)
    }
  })

  test('decodes valid config correctly', () => {
    const decode = Schema.decodeUnknownEither(DailyCoProxyConfig)
    const config = {
      _tag: 'daily_co_proxy',
      dailyCoProxyUrl: 'https://api.daily.co/proxy',
    }

    const result = decode(config)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right).toEqual(config)
    }
  })

  test('fails to decode missing dailyCoProxyUrl', () => {
    const decode = Schema.decodeUnknownEither(DailyCoProxyConfig)
    const config = {
      _tag: 'daily_co_proxy',
    }

    const result = decode(config)

    expect(Either.isLeft(result)).toBe(true)
  })

  test('fails to decode incorrect tag', () => {
    const decode = Schema.decodeUnknownEither(DailyCoProxyConfig)
    const config = {
      _tag: 'wrong_tag',
      dailyCoProxyUrl: 'https://proxy.example.com',
    }

    const result = decode(config)

    expect(Either.isLeft(result)).toBe(true)
  })

  test('accepts different URL formats', () => {
    const decode = Schema.decodeUnknownEither(DailyCoProxyConfig)
    const urls = [
      'https://proxy.example.com',
      'http://localhost:8080',
      'https://api.daily.co/v1/proxy',
    ]

    urls.forEach((url) => {
      const config = {
        _tag: 'daily_co_proxy',
        dailyCoProxyUrl: url,
      }
      const result = decode(config)
      expect(Either.isRight(result)).toBe(true)
    })
  })

  test('decodes config with valid recordings_bucket', () => {
    const decode = Schema.decodeUnknownEither(DailyCoProxyConfig)
    const config = {
      _tag: 'daily_co_proxy',
      dailyCoProxyUrl: 'https://api.daily.co/proxy',
      recordingsBucket: {
        bucket_name: 'my-recordings-bucket',
        bucket_region: 'us-east-1',
        assume_role_arn: 'arn:aws:iam::123456789012:role/DailyRecordingRole',
        allow_api_access: true,
      },
    }

    const result = decode(config)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right).toEqual(config)
    }
  })

  test('encodes config with valid recordings_bucket', () => {
    const encode = Schema.encodeUnknownEither(DailyCoProxyConfig)
    const config = {
      _tag: 'daily_co_proxy',
      dailyCoProxyUrl: 'https://proxy.example.com',
      recordingsBucket: {
        bucket_name: 'test-bucket',
        bucket_region: 'eu-west-1',
        assume_role_arn: 'arn:aws:iam::987654321098:role/TestRole',
        allow_api_access: false,
      },
    }

    const result = encode(config)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right).toEqual(config)
    }
  })

  test('fails to decode recordings_bucket with missing required fields', () => {
    const decode = Schema.decodeUnknownEither(DailyCoProxyConfig)
    const config = {
      _tag: 'daily_co_proxy',
      dailyCoProxyUrl: 'https://api.daily.co/proxy',
      recordingsBucket: {
        bucket_name: 'my-bucket',
        // Missing bucket_region, assume_role_arn, allow_api_access
      },
    }

    const result = decode(config)

    expect(Either.isLeft(result)).toBe(true)
  })

  test('fails to decode recordings_bucket with invalid allow_api_access type', () => {
    const decode = Schema.decodeUnknownEither(DailyCoProxyConfig)
    const config = {
      _tag: 'daily_co_proxy',
      dailyCoProxyUrl: 'https://api.daily.co/proxy',
      recordingsBucket: {
        bucket_name: 'my-bucket',
        bucket_region: 'us-west-2',
        assume_role_arn: 'arn:aws:iam::123456789012:role/Role',
        allow_api_access: 'yes', // Should be boolean
      },
    }

    const result = decode(config)

    expect(Either.isLeft(result)).toBe(true)
  })

  test('decodes config with different AWS regions', () => {
    const decode = Schema.decodeUnknownEither(DailyCoProxyConfig)
    const regions = [
      'us-east-1',
      'us-west-2',
      'eu-west-1',
      'ap-southeast-1',
      'ca-central-1',
    ]

    regions.forEach((region) => {
      const config = {
        _tag: 'daily_co_proxy',
        dailyCoProxyUrl: 'https://api.daily.co/proxy',
        recordingsBucket: {
          bucket_name: 'test-bucket',
          bucket_region: region,
          assume_role_arn: 'arn:aws:iam::123456789012:role/Role',
          allow_api_access: true,
        },
      }
      const result = decode(config)
      expect(Either.isRight(result)).toBe(true)
    })
  })
})

describe('RecordingsBucket', () => {
  test('decodes valid recordings bucket', () => {
    const decode = Schema.decodeUnknownEither(RecordingsBucket)
    const bucket = {
      bucket_name: 'my-bucket',
      bucket_region: 'us-east-1',
      assume_role_arn: 'arn:aws:iam::123456789012:role/DailyRole',
      allow_api_access: true,
    }

    const result = decode(bucket)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right).toEqual(bucket)
    }
  })

  test('fails to decode recordings bucket with missing bucket_name', () => {
    const decode = Schema.decodeUnknownEither(RecordingsBucket)
    const bucket = {
      bucket_region: 'us-east-1',
      assume_role_arn: 'arn:aws:iam::123456789012:role/DailyRole',
      allow_api_access: true,
    }

    const result = decode(bucket)

    expect(Either.isLeft(result)).toBe(true)
  })

  test('fails to decode recordings bucket with missing bucket_region', () => {
    const decode = Schema.decodeUnknownEither(RecordingsBucket)
    const bucket = {
      bucket_name: 'my-bucket',
      assume_role_arn: 'arn:aws:iam::123456789012:role/DailyRole',
      allow_api_access: true,
    }

    const result = decode(bucket)

    expect(Either.isLeft(result)).toBe(true)
  })

  test('fails to decode recordings bucket with missing assume_role_arn', () => {
    const decode = Schema.decodeUnknownEither(RecordingsBucket)
    const bucket = {
      bucket_name: 'my-bucket',
      bucket_region: 'us-east-1',
      allow_api_access: true,
    }

    const result = decode(bucket)

    expect(Either.isLeft(result)).toBe(true)
  })

  test('fails to decode recordings bucket with missing allow_api_access', () => {
    const decode = Schema.decodeUnknownEither(RecordingsBucket)
    const bucket = {
      bucket_name: 'my-bucket',
      bucket_region: 'us-east-1',
      assume_role_arn: 'arn:aws:iam::123456789012:role/DailyRole',
    }

    const result = decode(bucket)

    expect(Either.isLeft(result)).toBe(true)
  })
})
