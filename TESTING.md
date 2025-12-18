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

## 8. In Summary (AI Agents, Pay Attention)

When generating tests for this codebase:

1. **Default to `fast-check` properties.**
2. **Follow Domain-Specific Patterns:**
   - **Clinical:** Compile-time FHIR check + Round-trip check.
3. **Test Helper Identities:** Look for `get(with(x))` patterns and verify they are reversible.
4. **Keep it Concise:** Delete redundant properties. If the round-trip works, you don't need to test every field individually.
