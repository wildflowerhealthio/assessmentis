# TODO — deepAssignBaseUrls continuation

## What was done

1. **Created `domain/fhir-r4/src/deepAssignBaseUrls.ts`** — a recursive post-generation fixup that walks schema-generated values and rewrites `url` fields on Element-like objects (identified by `domainType` string property) to share a common FHIR base URL prefix.

2. **Created `domain/fhir-r4/src/deepAssignBaseUrls.test.ts`** — unit tests for the fixup. These 7 tests all pass.

3. **Updated all 19 test files in `domain/fhir-r4/src/`** to replace `ArbitraryWithFhirBaseUrl(Type, baseUrl)` with `Arbitrary.make(Type).map((v) => deepAssignBaseUrls(v, baseUrl))`. The old `ArbitraryWithFhirBaseUrl` import from `@assessmentis/effectful-store` has been fully removed from all fhir-r4 test files. Grep for `ArbitraryWithFhirBaseUrl` in `domain/fhir-r4/src/` returns zero results.

4. **Reverted `domain/fhir-r4/src/data-types/complex/Range.ts`** back to the standard `new TwoStepExternalSchema(Range, EncodedFromFhir)` pattern — the user's original sketch with the class wrapper and `ArbitraryOnUrl` is gone.

## What remains — the reconstruction bug

Running `npx vitest run --project 'fhir-r4:unit'` shows **11 pass, 15 fail**. The 11 that pass are simpler data types (Coding, Period, Quantity, Attachment, etc). The 15 that fail are resource types and more complex schemas.

### Root cause

`deepAssignBaseUrls` rebuilds objects during its recursive walk. The current approach:
1. Collects walked field values into a plain `Record<string, unknown>`
2. Tries `ctor.make(rebuilt)` if the constructor has a `make` static
3. Falls back to `Object.create(proto) + Object.assign`

This fails because:
- **`ctor.make()` goes through Schema.Class construction** which expects specific input shapes. The plain `rebuilt` object is missing internal properties that Effect's Data.Class sets up (like `_tag`, hash codes, structural equality metadata). The error is `Cannot read properties of undefined (reading '_tag')`.
- **Native `URL` objects** were being walked and reconstructed as plain objects — fixed by adding `if (v instanceof URL) return v` guard. But there may be other built-in types that need similar guards.
- **`Object.create(proto)` fallback** also fails for Schema.Class instances because it skips constructor-level setup that Effect internals depend on for encoding.

### Suggested fix approaches (not yet tried)

**Approach A — Don't reconstruct, just replace URLs in-place:**
Schema.Class instances from `Arbitrary.make` are freshly generated. Instead of rebuilding, mutate the `url` field directly. Check if Effect Schema.Class instances are frozen (they might be via Data.Class). If not frozen, `Object.defineProperty` or direct assignment works. If frozen, this approach won't work.

**Approach B — Only walk into known field names:**
Instead of walking ALL object entries, only recurse into fields that could contain nested Elements. Skip internal/Effect properties entirely. The challenge is knowing which fields to recurse into without schema metadata.

**Approach C — Use `Schema.make` instead of `Class.make`:**
`Schema.make(SchemaClass)(rebuilt)` might handle the internal setup differently than `SchemaClass.make(rebuilt)`. Worth investigating.

**Approach D — Clone-then-mutate via Schema round-trip:**
Encode the value to its encoded form (plain object), walk and fix URLs there, then decode back. This sidesteps the reconstruction issue entirely since you're working with plain encoded objects. Downside: requires the schema at the call site.

## Key files to read

- `domain/fhir-r4/src/deepAssignBaseUrls.ts` — the implementation to fix
- `domain/fhir-r4/src/deepAssignBaseUrls.test.ts` — unit tests (all pass)
- `domain/fhir-r4/src/data-types/complex/Range.test.ts` — example of a failing round-trip test
- `domain/clinical-domain/src/data-types/base/Element.ts` — defines Element with `domainType` and `url` fields
- `global/effectful-store/src/ReadonlyUrl.ts` — the ReadonlyUrl Schema.Class
- `global/effectful-store/src/ArbitraryWithBaseUrl.ts` — the old approach (still exists, no longer imported by fhir-r4)
- `global/util/src/TwoStepExternalSchema.ts` — schema wrapper used by all fhir-r4 schemas
- `docs/Agents/Learnings Inbox.md` — prior agent learnings, some relevant context

## Important context

- The user wants `ArbitraryWithFhirBaseUrl` fully replaced by `deepAssignBaseUrls` — it's "dead to us"
- The user approved the recursive fixup approach and the `as T` cast
- The user requested adding `instanceof ReadonlyUrl` AND `domainType` checks as guards (both present)
- Range.ts has been reverted to the simple pattern — don't re-add the class wrapper
- All 19 test file import/usage changes are complete and correct — only `deepAssignBaseUrls.ts` itself needs fixing
