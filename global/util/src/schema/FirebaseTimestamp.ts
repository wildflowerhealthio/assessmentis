import { DateTime, Schema } from 'effect'

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
