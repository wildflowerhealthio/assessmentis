import { DateTime, Effect, Option, ParseResult, Schema } from 'effect'

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

/**
 * The encoded (Firebase Timestamp) representation of a `DateTimeUtc`.
 */
export const FirebaseTimestamp = Schema.Struct({
  /**
   * The number of seconds of UTC time since Unix epoch 1970-01-01T00:00:00Z.
   */
  seconds: Schema.Number,
  /**
   * The fractions of a second at nanosecond resolution.
   */
  nanoseconds: Schema.Number,
})

/**
 * A bidirectional schema that decodes a Firebase Timestamp
 * (`{ seconds, nanoseconds }`) into an Effect `DateTime.Utc`,
 * and encodes a `DateTime.Utc` back into a Firebase Timestamp.
 */
export const DateTimeUtcFromFirebaseTimestamp = Schema.transform(
  FirebaseTimestamp,
  Schema.DateTimeUtc.pipe(Schema.typeSchema),
  {
    strict: true,
    decode: ({ seconds, nanoseconds }) =>
      DateTime.unsafeMake(seconds * 1000 + Math.floor(nanoseconds / 1_000_000)),
    encode: (dt) => {
      const epochMillis = DateTime.toEpochMillis(dt)
      const seconds = Math.floor(epochMillis / 1000)
      const nanoseconds = Number((epochMillis % 1000) * 1_000_000)
      return { seconds, nanoseconds }
    },
  }
)

export const DefaultAnything = <A, I = A, R = never>(
  to: Schema.Schema<A, I, R>,
  defaultValue: I
) =>
  Schema.optionalToRequired<unknown, unknown, never, A, I, R>(
    Schema.Unknown,
    to,
    {
      decode: (_: unknown): I => defaultValue,
      encode: (_: I): Option.Option<unknown> => Option.none<unknown>(),
    }
  )
export const DefaultSymbol = <Ts extends symbol>(s: Ts) =>
  DefaultAnything(Schema.UniqueSymbolFromSelf<Ts>(s), s)

// Create the enhanced schema with a symbol property on the Type side only
export const WithSymbolTag =
  <K extends symbol, S extends symbol>(k: K, s: S) =>
  <A extends object, I extends object, R>(schema: Schema.Schema<A, I, R>) =>
    Schema.transform(
      schema,
      // Use typeSchema so the "to" side doesn't re-decode the fields
      Schema.extend(
        schema,
        Schema.Record({
          key: Schema.UniqueSymbolFromSelf<K>(k),
          value: Schema.UniqueSymbolFromSelf<S>(s),
        })
      ).pipe(Schema.typeSchema),
      {
        strict: true,
        decode: (fromA: A, _fromI: I): A & { [k]: S } => ({ ...fromA, [k]: s }),
        encode: (
          _toI: A & { readonly [x in K]: S },
          toA: A & { readonly [x in K]: S }
        ): A => {
          const { [k]: _, ...justToA } = toA
          return justToA as A
        },
      }
    )

export const Prepend =
  <P extends string>(prefix: P) =>
  <A extends string, I extends string, R>(s: Schema.Schema<A, I, R>) =>
    Schema.transformOrFail(
      s,
      Schema.String as Schema.Schema<`${P}${A}`, `${P}${I}`, R>,
      {
        strict: true,
        decode(_fromA: A, _options, _ast, fromI: I): Effect.Effect<`${P}${I}`> {
          return Effect.succeed<`${P}${I}`>(`${prefix}${fromI}`)
        },
        encode(
          _toI: `${P}${I}`,
          _options,
          ast,
          toA: `${P}${A}`
        ): Effect.Effect<A, ParseResult.ParseIssue> {
          if (!toA.startsWith(prefix)) {
            return Effect.fail(
              new ParseResult.Forbidden(
                ast,
                toA,
                `String must start with prefix "${prefix}"`
              )
            )
          }
          return Effect.succeed(toA.slice(prefix.length) as A)
        },
      }
    )

// const WithFhirR4Url = <R extends string>(resourceType: R) =>
//   Schema.extend(
//     Schema.Struct({
//       [Resource.ResourceUrl]: Schema.String.pipe(
//         Prepend(`/${resourceType}/`),
//         Schema.propertySignature,
//         Schema.fromKey('id')
//       ),
//     })
//   )

export interface mutableEncoded<
  S extends Schema.Schema.Any,
> extends Schema.AnnotableClass<
  mutableEncoded<S>,
  Schema.Simplify<Schema.Schema.Type<S>>,
  Schema.SimplifyMutable<Schema.Schema.Encoded<S>>,
  Schema.Schema.Context<S>
> {}

export const mutableEncoded = <S extends Schema.Schema.Any>(
  schema: S
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): mutableEncoded<S> => Schema.mutable(schema) as any
