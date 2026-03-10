import { ParseResult, Schema } from 'effect'

export const TimelessDateFromString = Schema.transformOrFail(
  // Source schema
  Schema.String.pipe(Schema.pattern(/^\d{4}-\d{2}-\d{2}$/)).annotations({
    arbitrary: () => (fc) =>
      fc
        .date()
        .filter(
          (date) => date.getFullYear() >= 1900 && date.getFullYear() <= 2100
        )
        .map((date) => {
          return date.toISOString().substring(0, 10)
        }),
  }),
  // Target schema
  Schema.DateFromSelf.annotations({
    arbitrary: () => (fc) =>
      fc
        .date()
        .filter(
          (date) => date.getFullYear() >= 1900 && date.getFullYear() <= 2100
        )
        .map((date) => {
          date.setUTCHours(0, 0, 0, 0)
          return date
        }),
  }),
  {
    // optional but you get better error messages from TypeScript
    strict: true,
    // Transformation to convert the output of the source schema (string)
    // into the input of the target schema (Date)
    decode: (str) => {
      // Check if the string matches YYYY-MM-DD format
      const datePattern = /^\d{4}-\d{2}-\d{2}$/
      if (!datePattern.test(str)) {
        return ParseResult.fail(
          new ParseResult.Type(
            Schema.String.ast,
            str,
            'String must be in YYYY-MM-DD format'
          )
        )
      }

      const parsed = Date.parse(str)
      if (isNaN(parsed)) {
        return ParseResult.fail(
          new ParseResult.Type(
            Schema.String.ast,
            str,
            'String must be a valid date'
          )
        )
      }

      const date = new Date(parsed)

      // Verify the time is exactly midnight (00:00:00.000)
      // Check both local time and UTC
      const isLocalMidnight =
        date.getHours() === 0 &&
        date.getMinutes() === 0 &&
        date.getSeconds() === 0 &&
        date.getMilliseconds() === 0

      const isUTCMidnight =
        date.getUTCHours() === 0 &&
        date.getUTCMinutes() === 0 &&
        date.getUTCSeconds() === 0 &&
        date.getUTCMilliseconds() === 0

      if (!isLocalMidnight && !isUTCMidnight) {
        return ParseResult.fail(
          new ParseResult.Type(
            Schema.String.ast,
            str,
            'Date must have time component of 00:00:00.000 (local or UTC)'
          )
        )
      }

      return ParseResult.succeed(date)
    },

    // Reverse transformation
    encode: (date) => {
      // Verify the date has midnight time (local or UTC)
      const isLocalMidnight =
        date.getHours() === 0 &&
        date.getMinutes() === 0 &&
        date.getSeconds() === 0 &&
        date.getMilliseconds() === 0

      const isUTCMidnight =
        date.getUTCHours() === 0 &&
        date.getUTCMinutes() === 0 &&
        date.getUTCSeconds() === 0 &&
        date.getUTCMilliseconds() === 0

      if (!isLocalMidnight && !isUTCMidnight) {
        return ParseResult.fail(
          new ParseResult.Type(
            Schema.DateFromSelf.ast,
            date,
            'Date must have time component of 00:00:00.000 (local or UTC)'
          )
        )
      }

      return ParseResult.succeed(date.toISOString().substring(0, 10))
    },
  }
)
