import { DateTime, Effect, TestClock, TestContext } from 'effect'
import { describe, expect, test } from 'vitest'

import { Period } from '@assessmentis/clinical-domain/data-types'

import {
  humanizeDateRange,
  humanizeDateTimeForLocalReader,
  humanizeDateTimeRangeForLocalReader,
  humanizeDateTimeWithTime,
  humanizeTimelessDate,
} from './date-utils'

// Fixed reference time for deterministic tests: June 1, 2024 12:00:00 UTC
const FIXED_NOW = DateTime.unsafeMakeZoned(
  {
    day: 1,
    hours: 12,
    minutes: 0,
    month: 6,
    seconds: 0,
    year: 2024,
  },
  { timeZone: 'UTC' }
)
const DEFAULT_TZ = 'America/Toronto'
const OTHER_TZ = 'Europe/London'
/**
 * Run an Effect with a fixed Clock and timezone for deterministic testing
 */
function runWithFixedClock<A>(
  effect: Effect.Effect<A, never, DateTime.CurrentTimeZone>
): Promise<A> {
  return Effect.gen(function* () {
    yield* TestClock.setTime(FIXED_NOW)
    return yield* effect.pipe(DateTime.withCurrentZoneNamed(DEFAULT_TZ))
  }).pipe(Effect.provide(TestContext.TestContext), Effect.runPromise)
}

describe('humanizeTimelessDate', () => {
  test.each([
    {
      date: undefined,
      fallback: 'Unknown',
      returns: 'Unknown',
      testcase: 'undefined date returns fallback',
    },
    {
      date: new Date('invalid-date'),
      fallback: 'Unknown',
      returns: 'Unknown',
      testcase: 'invalid date returns fallback',
    },
    {
      date: new Date('2024-03-03T12:00:00Z'),
      returns: 'Mar 3, 2024',
      testcase: 'exactly 90 days from FIXED_NOW includes year',
    },
    {
      date: new Date('2024-03-04T00:00:00Z'),
      returns: 'Mar 4',
      testcase: 'less than 90 days before FIXED_NOW includes year',
    },
    {
      date: new Date('2024-08-29T00:00:00Z'),
      returns: 'Aug 29',
      testcase: 'almost 90 days after FIXED_NOW omits year',
    },
    {
      date: new Date('2024-09-01T00:00:01Z'),
      returns: 'Sep 1, 2024',
      testcase: 'more than 90 days after FIXED_NOW includes year',
    },
  ])('$testcase', async ({ date, fallback = '', returns }) => {
    const result = await runWithFixedClock(humanizeTimelessDate(date, fallback))
    expect(result).toBe(returns)
  })
})

describe('humanizeDateTimeForLocalReader', () => {
  test.each([
    {
      dateTime: undefined,
      expected: 'N/A',
      fallback: 'N/A',
      testcase: 'undefined dateTime returns fallback',
    },
    {
      dateTime: DateTime.unsafeFromDate(new Date('2024-01-15T10:30:00Z')),
      expected: 'Jan 15, 2024',
      fallback: 'Unknown',
      testcase: 'more than 90 days from FIXED_NOW uses medium style',
    },
  ])('$testcase', async ({ dateTime, fallback, expected }) => {
    const result = await runWithFixedClock(humanizeDateTimeForLocalReader(dateTime, fallback))
    expect(result).toBe(expected)
  })
})

describe('humanizeDateTimeWithTime', () => {
  const localOptions = { timeZone: DateTime.zoneUnsafeMakeNamed(DEFAULT_TZ) }
  test.each([
    {
      dateTime: undefined,
      fallback: 'N/A',
      returns: 'N/A',
      testcase: 'undefined dateTime returns fallback',
    },
    {
      dateTime: DateTime.unsafeMakeZoned('2024-03-03T11:34:00Z', localOptions),
      returns: 'Mar 3, 2024, 6:34 AM',
      testcase: 'exactly 90 days from FIXED_NOW includes year',
    },
    {
      dateTime: DateTime.unsafeMakeZoned('2024-03-04T12:34:00Z', localOptions),
      returns: 'Mar 4, 7:34 AM',
      testcase: 'less than 90 days before FIXED_NOW includes year',
    },
    {
      dateTime: DateTime.unsafeMakeZoned('2024-08-29T12:34:00Z', localOptions),
      returns: 'Aug 29, 8:34 AM',
      testcase: 'almost 90 days after FIXED_NOW omits year',
    },
    {
      dateTime: DateTime.unsafeMakeZoned('2024-09-01T12:34:00Z', localOptions),
      returns: 'Sep 1, 2024, 8:34 AM',
      testcase: 'more than 90 days after FIXED_NOW includes year',
    },
  ])('$testcase', async ({ dateTime, fallback = '', returns }) => {
    const result = await runWithFixedClock(humanizeDateTimeWithTime(dateTime, fallback))
    expect(result).toBe(returns)
  })

  describe('when the dateTime is in a different timezone', () => {
    const otherOptions = { timeZone: DateTime.zoneUnsafeMakeNamed(OTHER_TZ) }
    test.each([
      {
        dateTime: DateTime.unsafeMakeZoned('2024-03-04T12:34:00Z', otherOptions),
        returns: 'Mar 4, 7:34 AM EST',
        testcase: 'less than 90 days before FIXED_NOW includes year',
      },
      {
        dateTime: DateTime.unsafeMakeZoned('2024-09-01T12:34:00Z', otherOptions),
        returns: 'Sep 1, 2024, 8:34 AM EDT',
        testcase: 'more than 90 days after FIXED_NOW in other timezone includes year',
      },
    ])('$testcase', async ({ dateTime, returns }) => {
      const result = await runWithFixedClock(humanizeDateTimeWithTime(dateTime, ''))
      expect(result).toBe(returns)
    })
  })

  describe('when the dateTime is in UTC', () => {
    test.each([
      {
        dateTime: DateTime.unsafeMake('2024-03-04T12:34:00Z'),
        returns: 'Mar 4, 7:34 AM',
        testcase: 'less than 90 days before FIXED_NOW includes year',
      },
      {
        dateTime: DateTime.unsafeMake('2024-09-01T12:34:00Z'),
        returns: 'Sep 1, 2024, 8:34 AM',
        testcase: 'more than 90 days after FIXED_NOW in other timezone includes year',
      },
    ])('$testcase', async ({ dateTime, returns }) => {
      const result = await runWithFixedClock(humanizeDateTimeWithTime(dateTime, ''))
      expect(result).toBe(returns)
    })
  })
})

describe('humanizeDateRange', () => {
  test.each([
    {
      expected: 'Unknown Range',
      options: {},
      period: undefined,
      testcase: 'undefined period returns neitherFallback',
    },
    {
      expected: 'Unknown Range',
      options: {},
      period: Period.make({ start: undefined, end: undefined }),
      testcase: 'empty period returns neitherFallback',
    },
    {
      expected: 'January 15th 5 AM - 6 AM',
      options: {},
      period: Period.make({
        start: DateTime.unsafeFromDate(new Date('2024-01-15T10:00:00Z')),
        end: DateTime.unsafeFromDate(new Date('2024-01-15T11:00:00Z')),
      }),
      testcase: 'same day range shows compact format with times',
    },
    {
      expected: 'Start missing - Jan 15, 2024',
      options: { startFallback: 'Start missing' },
      period: Period.make({
        start: undefined,
        end: DateTime.unsafeFromDate(new Date('2024-01-15T10:00:00Z')),
      }),
      testcase: 'missing start uses startFallback',
    },
    {
      expected: 'Jan 15, 2024 - Ongoing',
      options: { endFallback: 'Ongoing' },
      period: Period.make({
        start: DateTime.unsafeFromDate(new Date('2024-01-15T10:00:00Z')),
        end: undefined,
      }),
      testcase: 'missing end uses endFallback',
    },
  ])('$testcase', async ({ period, options, expected }) => {
    const result = await runWithFixedClock(humanizeDateRange(period, options))
    expect(result).toBe(expected)
  })
})

describe('humanizeDateTimeRangeForLocalReader', () => {
  test.each([
    {
      expected: 'Unknown Range',
      options: {},
      period: undefined,
      testcase: 'undefined period returns neitherFallback',
    },
    {
      expected: 'Unknown Range',
      options: {},
      period: Period.make({ start: undefined, end: undefined }),
      testcase: 'empty period returns neitherFallback',
    },
    {
      expected: 'Jan 15, 2024, 4:00 AM - Jan 16, 2024, 12:30 PM',
      options: {},
      period: Period.make({
        start: DateTime.unsafeFromDate(new Date('2024-01-15T09:00:00Z')),
        end: DateTime.unsafeFromDate(new Date('2024-01-16T17:30:00Z')),
      }),
      testcase: 'different days use medium style with comma',
    },
    {
      expected: 'Not specified - Jan 15, 2024, 5:00 AM',
      options: { startFallback: 'Not specified' },
      period: Period.make({
        start: undefined,
        end: DateTime.unsafeFromDate(new Date('2024-01-15T10:00:00Z')),
      }),
      testcase: 'missing start uses startFallback',
    },
    {
      expected: 'Jan 15, 2024, 5:00 AM - Ongoing',
      options: { endFallback: 'Ongoing' },
      period: Period.make({
        start: DateTime.unsafeFromDate(new Date('2024-01-15T10:00:00Z')),
        end: undefined,
      }),
      testcase: 'missing end uses endFallback',
    },
  ])('$testcase', async ({ period, options, expected }) => {
    const result = await runWithFixedClock(humanizeDateTimeRangeForLocalReader(period, options))
    expect(result).toBe(expected)
  })
})
