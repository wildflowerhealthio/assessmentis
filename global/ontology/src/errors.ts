import { Data, type Arbitrary, type FastCheck } from 'effect'

/**
 * An error that was not anticipated has occurred, no specific handling exists
 */
export class UnhandledError extends Data.TaggedError('UnhandledError')<{
  cause?: unknown
  message: string
}> {
  constructor(params: { cause?: unknown; message: string }) {
    super(params)
    if (this.cause instanceof Error) {
      this.message = params.message ?? this.cause.message ?? this.message
      this.stack = this.cause.stack ?? this.stack
      if (this.cause.name) this.name = `Unhandled${this.cause.name}`
    } else {
      this.message = params.message ?? this.message
    }
  }

  asUnhandledError() {
    return this
  }

  static get arbitrary(): Arbitrary.LazyArbitrary<UnhandledError> {
    return (fc: typeof FastCheck) =>
      fc
        .string()
        .chain((message) =>
          fc.anything().map((cause) => new UnhandledError({ message, cause }))
        )
  }
}

/**
 * An external system is not behaving as expected
 */
export class ExternalAssertionError extends Data.TaggedError(
  'ExternalAssertionError'
)<{
  expected: string
  cause?: unknown
}> {
  constructor(params: { cause: unknown; expected: string }) {
    super(params)
    if (this.cause instanceof Error) {
      this.message = this.cause.message ?? this.message
      this.stack = this.cause.stack ?? this.stack
      if (this.cause.name) this.name = `Unhandled${this.cause.name}`
    }
  }

  asUnhandledError() {
    return new UnhandledError({
      message: `External assertion failed: expected ${this.expected}`,
      cause: this.cause,
    })
  }
}

/**
 * Data controlled within the system does not conform to expected schema
 */
export class BadDataError extends Data.TaggedError('BadDataError')<{
  message: string
  cause?: unknown
}> {
  constructor(params: { cause?: unknown; message: string }) {
    super(params)
    if (this.cause instanceof Error) {
      this.message = params.message ?? this.cause.message ?? this.message
      this.stack = this.cause.stack ?? this.stack
      if (this.cause.name) this.name = `Unhandled${this.cause.name}`
    } else {
      this.message = params.message ?? this.message
    }
  }

  asUnhandledError() {
    return new UnhandledError({
      message: `Bad data was found: ${this.message}`,
      cause: this.cause,
    })
  }
}

/**
 * Resource not found
 */
export class NotFoundError<
  out ResourceType extends PropertyKey,
  out Parameters extends Record<string, unknown>,
> extends Data.TaggedError('NotFoundError')<{
  resourceType: ResourceType
  params: Parameters
  cause?: unknown
}> {
  static readonly tag = 'NotFoundError'

  asUnhandledError() {
    return new UnhandledError({
      message: `Resource of type ${String(this.resourceType)} not found with parameters: ${JSON.stringify(
        this.params
      )}`,
      cause: this.cause,
    })
  }
}

/**
 * Authentication error
 */
export class AuthError extends Data.TaggedError('AuthError')<{
  message: string
  cause?: unknown
}> {
  static readonly tag = 'AuthError' as const

  static Unauthenticated = new AuthError({
    message: 'User is not authenticated',
  })

  asUnhandledError() {
    return new UnhandledError({
      message: `Authentication error: ${this.message}`,
      cause: this.cause,
    })
  }

  static get arbitrary(): Arbitrary.LazyArbitrary<AuthError> {
    return (fc: typeof FastCheck) =>
      fc.string().map((message) => new AuthError({ message }))
  }
}

/**
 * Authorization error (authenticated but lacking permissions)
 */
export class AuthzError extends Data.TaggedError('AuthzError')<{
  message: string
  cause?: unknown
}> {
  static readonly tag = 'AuthzError' as const

  asUnhandledError() {
    return new UnhandledError({
      message: `Authorization error: ${this.message}`,
      cause: this.cause,
    })
  }

  static get arbitrary(): Arbitrary.LazyArbitrary<AuthzError> {
    return (fc: typeof FastCheck) =>
      fc
        .string()
        .chain((message) =>
          fc.anything().map((cause) => new AuthzError({ message, cause }))
        )
  }
}

export class Loading<
  Entity extends { toString(): string },
> extends Data.TaggedError('Loading')<{
  entity: Entity
}> {
  static readonly tag = 'Loading' as const
  constructor(params: { entity: Entity }) {
    super(params)
    this.message = `Loading ${params.entity}...`
  }
}
