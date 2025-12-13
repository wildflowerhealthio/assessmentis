import { expect, test, describe } from 'vitest'
import { Schema, Either } from 'effect'
import { DailyCoProxyConfig } from './index'

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
})
