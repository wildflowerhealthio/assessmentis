import type { Arbitrary, FastCheck } from 'effect'
import { Schema } from 'effect'

/**
 * An Effect Schema for a `YYYY-MM-DD` date string. Validates the format
 * via regex but does not transform to a `Date` object. Designed for
 * timezone-independent dates (e.g. birthdays) where the time component
 * is meaningless.
 *
 * The decoded type is a branded string (`string & Brand<"TimelessDate">`),
 * not a plain string, so it cannot be confused with arbitrary strings.
 *
 * Includes custom arbitraries constrained to years 1900–2100.
 */
export const TimelessDateFromString = Schema.String.pipe(
  Schema.pattern(/^\d{4}-\d{2}-\d{2}$/),
  Schema.annotations({
    arbitrary: (): Arbitrary.LazyArbitrary<string> => (fc: typeof FastCheck) =>
      fc
        .date()
        .filter((date) => date.getFullYear() >= 1900 && date.getFullYear() <= 2100)
        .map((date) => date.toISOString().slice(0, 10)),
  }),
  Schema.brand('TimelessDate')
)

/** The branded type for a validated `YYYY-MM-DD` date string. */
export type TimelessDate = typeof TimelessDateFromString.Type
