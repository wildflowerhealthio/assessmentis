# Testing Philosophy & Guidelines

This project prioritizes **Property-Based Testing** over example-based testing. Our goal is to define _properties_ that should always hold true for our code, rather than checking specific input/output pairs. This approach, powered by `fast-check` (and to some degree `effect`), allows us to cover edge cases we might never think of manually.

## 1. Property-Based Testing First

Avoid writing manual test cases (e.g., `expect(add(1, 1)).toBe(2)`). Instead, describe the general properties of your function.

- **Why?** Manual cases only prove your code works for the specific inputs you thought of. Properties prove your code works for 100's of valid inputs.
- **Exception:** Use manual/example-based tests for **Regression Testing** (reproducing a specific bug) or **Documentation** (showing a clear, simple usage example).

## 2. File Organization & Naming

- **Colocation:** Test files should be located next to the source file they test.
- **Naming:** Use `*.test.ts` for test files.
- **Scope:** One test file per source file is the default, but complex domains (like `Composition`) may split tests into focused sub-files (e.g., `CompositionAttester.test.ts`).

## 3. Mutually Exclusive, Completely Exhaustive (MECE)

Structure your test suites to be **MECE**.

- Identify the "edges" of behavior or specification.
- Use nested `describe` blocks to clearly delineate these boundaries.
- Ensure every possible state falls into exactly one bucket.
- If a test fails, it should be immediately obvious _which_ logical branch of the system is broken.

## 3. Algebraic Properties

Test for mathematical truths in your code.

- **Round-tripping:** `decode(encode(x)) === x`. This is the gold standard for schemas and data types.
- **Idempotence:** `f(f(x)) === f(x)`.
- **Invariants:** "The list size never decreases" or "The total value remains constant."

## 5. Domain-Specific Patterns

### Clinical Domain (FHIR Resources)

For clinical domain resources, we follow a strict, consistent pattern to ensure FHIR R4 compatibility.

#### A. FHIR Compatibility Check

We enforce strict compatibility with FHIR R4 types at compile time. Add a check like this one at the top of your test file when testing a FHIR compatible resource:

```typescript
import { Composition } from './Composition'
import { Composition as FhirComposition } from 'fhir/r4'

// Compile-time check: Encoded schema must match FHIR R4 type
const _check: DeepReadonly<FhirComposition> = Composition.Encoded
```

#### B. Round-Trip Property

The primary test for any Schema is that it can round-trip data without loss.
`Arbitrary.make(Schema)` produces an _unencoded_ instance. You must **encode** it, then **decode** it, and verify equality. Note that `Arbitrary.make(Schema)` is useful for any test that uses a type defined with a schema. You should almost always favour it over manual constructions

```typescript
const compositionArb = Arbitrary.make(Composition)

fc.assert(
  fc.property(compositionArb, (val) => {
    const encoded = Schema.encodeSync(Composition)(val)
    const decoded = Schema.decodeSync(Composition)(encoded)
    expect(decoded).toEqual(val)
  })
)
```

## 6. Concise & High-Value Tests

**Quality > Quantity.** A single, powerful property test is better than 10 trivial ones.

- **Avoid Redundancy:** Do not write separate properties for every field or trivial getter. If the Round-Trip property passes, you've likely covered the structure.
- **Test Non-Obvious Behaviors:** Focus on helper functions that transform data.
  - **Identity/Round-trip of Helpers:** `get(with(x, val)) === val`.
  - _Example:_ `getTranscripts(withTranscripts(encounter, urls))` should equal `urls`. This verifies the logic of both functions simultaneously.
- **Length:** If a test file is becoming huge, ask: "Am I testing the implementation details or the behavior?" Keep it short.

## 7. Testing Effects

Use stubbed contexts to run Effects with known inputs. This allows deterministic testing of side-effectful code without mocking the world.

### Exit/Error Handling Pattern

When testing Effects that may fail, use runPromiseExit to get the result. Use functional composition with `pipe` instead of nested conditionals to extract the inner error from the Exit

```typescript
// ❌ AVOID: Nested conditionals
const exit = await Effect.runPromiseExit(program)
if (Exit.isFailure(exit)) {
  const error = Cause.squash(exit.cause) as any
  expect(error._tag).toBe('SomeError')
}

// ✅ PREFERRED: Functional pipe pattern
import { pipe, Exit, Cause, Option } from 'effect'

const exit = await Effect.runPromiseExit(program)
expect(Exit.isFailure(exit)).toBe(true)
const error = pipe(
  exit,
  Exit.causeOption,
  Option.flatMap(Cause.failureOption),
  Option.getOrThrow
)
expect(error._tag).toBe('SomeError')
```

### Using Schema Arbitraries

Use `Arbitrary.make(Schema)` to generate test data from Effect Schemas. It should be preferred to object literals as it allows for more compact and generalized tests.

```typescript
import { Arbitrary } from 'effect'
import { Org } from '@assessmentis/platform-domain'

const orgArb = Arbitrary.make(Org)

it('property: handles any valid org', async () => {
  await fc.assert(
    fc.asyncProperty(orgArb, async (org) => {
      // Test with generated org values
      const result = await Effect.runPromise(myService(org))
      expect(result).toBeDefined()
    })
  )
})
```

## 8. React Component Testing

### Environment Setup

**Do NOT manually initialize JSDOM.** Vitest is configured with `environment: 'jsdom'` which automatically provides DOM globals.

```typescript
// ❌ AVOID: Redundant JSDOM setup
import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window as unknown as typeof globalThis.window
globalThis.document = dom.window.document

// ✅ CORRECT: Just import what you need
import { renderHook, act } from '@testing-library/react'
```

### Console Mocking

Suppress console noise in tests to keep output clean:

```typescript
import { vi, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})
```

### Testing with waitFor

**Do NOT wrap `waitFor` in `act()`.** The `waitFor` function from `@testing-library/react` already handles `act()` internally. Double-wrapping can cause timing issues.

```typescript
// ❌ AVOID: Double-wrapping causes issues
await act(async () => {
  await waitFor(() => {
    expect(screen.getByText('Content')).toBeDefined()
  })
})

// ✅ CORRECT: waitFor handles act() internally
await waitFor(() => {
  expect(screen.getByText('Content')).toBeDefined()
})
```

### Reducing Mock Duplication

Create helper factories to reduce boilerplate in tests with complex mocks:

```typescript
// Helper factory for platform context mocks
const createMockPlatformContext = (
  overrides: {
    activeOrgStream?: Stream.Stream<Either.Either<Org, Error>>
    activeOrg?: Effect.Effect<Org | null>
    userOrgs?: Record<string, string>
  } = {}
) => ({
  authDataService: {} as any,
  orgService: {
    activeOrgStream: overrides.activeOrgStream ?? Stream.empty,
    activeOrg: overrides.activeOrg ?? Effect.succeed(mockOrg),
    setActiveOrgSlug: mockSetActiveOrgSlug,
  } as any,
  userService: {
    user: Effect.succeed({
      org_roles: overrides.userOrgs ?? { 'test-org': 'admin' },
    }),
  } as any,
  // ... other services
})

// Usage in tests
it('should show org picker when no org selected', async () => {
  vi.mocked(usePlatformContext).mockReturnValue(
    createMockPlatformContext({
      activeOrgStream: Stream.succeed(Either.left(new NoSelectedOrgError({}))),
      userOrgs: { 'test-org': 'admin', 'another-org': 'member' },
    })
  )
  // ... test body
})
```

### Testing Hooks with Effects

For hooks that use Effect-TS, wrap state transitions in `act()`:

```typescript
import { renderHook, act } from '@testing-library/react'

it('should resolve effect correctly', async () => {
  const { result, unmount } = renderHook(() => useEffectTs(Effect.succeed(42)))

  await act(async () => {
    await new Promise((r) => setTimeout(r, 50))
  })

  await expect(result.current).resolves.toBe(42)
  unmount()
})
```

### Handling Promise Rejections

Catch promise rejections early to prevent unhandled rejection warnings:

```typescript
it('should reject with error', async () => {
  const error = new Error('test error')
  const { result, unmount } = renderHook(() => useEffectTs(Effect.fail(error)))

  // Catch early to prevent unhandled rejection warnings
  const errorPromise = result.current.catch((e) => e)

  await act(async () => {
    await new Promise((r) => setTimeout(r, 50))
  })

  const caught = await errorPromise
  expect(caught).toBe(error)
  unmount()
})
```

## 9. Property Test Arbitraries

### Use Constrained Arbitraries

Prefer specific arbitraries over generic ones for better test reliability:

```typescript
// ❌ AVOID: Too generic
fc.anything()

// ✅ PREFERRED: Constrained arbitraries
fc.integer()
fc.string({ minLength: 1, maxLength: 100 })
fc.webUrl()
```

### When fc.constantFrom() is Appropriate

Use `fc.constantFrom()` when testing specific behavior variations (like error types), not for general data generation:

```typescript
// ✅ APPROPRIATE: Testing specific error type handling
fc.constantFrom(
  new NoSelectedOrgError({ message: 'No org' }),
  new UnhandledError({ message: 'Unhandled' })
)

// ❌ AVOID: Use Arbitrary.make() for data generation
fc.constantFrom(mockOrg1, mockOrg2) // Only 2 values!

// ✅ PREFERRED: Schema-based arbitrary
Arbitrary.make(Org)
```

## 10. In Summary (AI Agents, Pay Attention)

When generating tests for this codebase:

1. **Default to `fast-check` properties** with `Arbitrary.make(Schema)` for data generation.
2. **Follow Domain-Specific Patterns:**
   - **Clinical:** Compile-time FHIR check + Round-trip check.
   - **React Components:** Use `waitFor` without `act()` wrapper, mock console output.
   - **Effect-TS:** Use `pipe` pattern for error handling, not nested conditionals.
3. **Test Helper Identities:** Look for `get(with(x))` patterns and verify they are reversible.
4. **Keep it Concise:** Delete redundant properties. If the round-trip works, you don't need to test every field individually.
5. **Environment:** Do NOT manually set up JSDOM - Vitest handles it.
6. **Reduce Duplication:** Create helper factories for complex mock setups.
