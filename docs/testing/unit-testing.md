# Unit Testing

Property-based testing is the default approach. Describe the general properties of your code rather than checking specific input/output pairs.

**Exception:** Use example-based tests for regression testing (reproducing a specific bug) or documentation (showing a clear usage example).

## File Organization

- **Colocate** test files next to the source: `MyModule.test.ts` beside `MyModule.ts`
- Complex domains may split into focused sub-files (e.g., `CompositionAttester.test.ts`)

## MECE Test Structure

Structure test suites to be **Mutually Exclusive, Completely Exhaustive**:

- Identify the edges of behavior or specification
- Use nested `describe` blocks to delineate boundaries
- Ensure every possible state falls into exactly one bucket
- A failing test should immediately indicate which logical branch is broken

## Algebraic Properties

Test for mathematical truths in your code:

- **Round-tripping:** `decode(encode(x)) === x` -- the gold standard for schemas and data types
- **Idempotence:** `f(f(x)) === f(x)`
- **Invariants:** "The list size never decreases" or "The total value remains constant"
- **Helper identity:** `get(with(x, val)) === val`

## Clinical Domain (FHIR Resources)

For FHIR resources, follow this pattern:

### Compile-Time FHIR Check

```typescript
import { Composition } from './Composition'
import { Composition as FhirComposition } from 'fhir/r4'

// Compile-time check: Encoded schema must match FHIR R4 type
const _check: DeepReadonly<FhirComposition> = Composition.Encoded
```

### Round-Trip Property

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

## Testing Effects

Use stubbed contexts to run Effects with known inputs.

### Exit/Error Handling

Use functional composition with `pipe` instead of nested conditionals:

```typescript
// Preferred: Functional pipe pattern
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

### Schema Arbitraries

Use `Arbitrary.make(Schema)` to generate test data. Prefer it over object literals for more compact, generalized tests.

```typescript
import { Arbitrary } from 'effect'
import { Org } from '@assessmentis/platform-domain'

const orgArb = Arbitrary.make(Org)

it('property: handles any valid org', async () => {
  await fc.assert(
    fc.asyncProperty(orgArb, async (org) => {
      const result = await Effect.runPromise(myService(org))
      expect(result).toBeDefined()
    })
  )
})
```

## Property Test Arbitraries

Prefer specific arbitraries over generic ones:

```typescript
// Avoid: fc.anything()
// Prefer:
fc.integer()
fc.string({ minLength: 1, maxLength: 100 })
fc.webUrl()
```

Use `fc.constantFrom()` only when testing specific behavior variations (like error types), not for general data generation. For data generation, use `Arbitrary.make(Schema)`.

## Concise Tests

Quality over quantity. A single powerful property test is better than 10 trivial ones.

- If the round-trip property passes, the structure is covered -- don't test every field individually
- Focus on helper functions that transform data: verify `get(with(x, val)) === val`
- If a test file is growing large, ask: "Am I testing implementation details or behavior?"
