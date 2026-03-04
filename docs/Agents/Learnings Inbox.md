# Learnings Inbox

Append-only log for agent-discovered knowledge. Agents add entries here during work; the human reviews periodically and promotes entries to [Strategies.md](./Strategies.md) or the relevant domain reference doc, or discards them.

## Instructions for agents

- **Read this file at session start** alongside Strategies.md — it may contain recent un-graduated learnings relevant to your task.
- **Append an entry** whenever you discover something non-obvious that the next agent should know.
- **Do not edit or remove existing entries** — curation is the human's job.
- If you notice an existing entry is outdated or wrong, append a new entry saying so rather than deleting the original.

## Entry format

```markdown
### [short title]
**Discovered during**: [task or branch name]
**Learning**: [the actionable insight]
**Suggested destination**: Strategies | [path to a specific reference doc] | unsure
```

---

<!-- Append new entries below this line -->

### TypeScript doesn't merge imported types with local const declarations

**Discovered during**: ruthmarks/refactor/seperate-fhir-from-data-types (Step 5 — copying schemas to fhir-r4)
**Learning**: `import type { X } from '...'` + `export const X = { ... }` causes TS2395/TS2440 ("Individual declarations in merged declaration 'X' must be all exported or all local" / "Import declaration conflicts with local declaration"). Declaration merging only works when both the interface and const are declared in the **same module**. When copying schemas to a separate package that imports types from the original, use a prefix (e.g., `FhirR4X`) or alias the import (`import type { X as XType }`).
**Suggested destination**: domain/clinical-domain/docs/FHIR Modeling Reference.md

### Downstream `FromFhirR4` reference update checklist

**Discovered during**: ruthmarks/refactor/seperate-fhir-from-data-types (Step 4)
**Learning**: When renaming schemas from `XFromFhirR4` to `X.Schema`, downstream consumers require coordinated updates. The mechanical pattern is: (1) replace `XFromFhirR4` with `X.Schema` in usages, (2) merge separate `import type { X }` + `import { XFromFhirR4 }` into single `import { X }`, (3) where only the type was imported separately and the schema is now on the same const, the single value import covers both. Use `grep -r 'FromFhirR4' --include='*.ts' --include='*.tsx'` across the monorepo to find all references — they span domain packages, apps/frontend, and apps/functions.
**Suggested destination**: Strategies

### Schema.suspend does NOT break Vite SSR circular imports

**Discovered during**: ruthmarks/refactor/seperate-fhir-from-data-types (debugging circular import in Element ↔ Extension)
**Learning**: `Schema.suspend(() => X)` defers schema *evaluation* but does NOT prevent module *loading*. In Vite SSR, `import { X } from './X'` eagerly triggers the module to load. If module A imports B and B imports A, Vite SSR snapshots A's exports (which are `undefined` at that point) before A finishes executing. The `Schema.suspend` callback runs later, but if module B calls `A.Element()` at class definition time (outside `Schema.suspend`), it crashes with `TypeError: Element is not a function`. The fix is to restructure so no import chain from A leads back to A — co-locate circular types in one file (like `IdentifierAndReference.ts`) or eliminate the cycle entirely.
**Suggested destination**: domain/clinical-domain/docs/FHIR Modeling Reference.md

### FHIR R4 defines per-element allowed types for value[x] choice elements

**Discovered during**: ruthmarks/refactor/seperate-fhir-from-data-types (designing Datatype approach)
**Learning**: `https://hl7.org/fhir/R4/choice-elements.json` maps all 122 FHIR R4 choice elements to their allowed types. Each element has its own specific list — e.g., `Observation.value[x]` allows 11 types while `Questionnaire.item.answerOption.value[x]` allows only 6. A single "all value types optional" struct (like the old `ValueElement`) is both overconstrained (missing allowed types) and underconstrained (no exactly-one enforcement). Model value[x] as a tagged union (`Schema.Union`) where each branch has exactly one `value${Name}` field. Include the JSON as a definitional file in the project.
**Suggested destination**: domain/clinical-domain/docs/FHIR Modeling Reference.md

### Circular dependency chains can be transitive and non-obvious

**Discovered during**: ruthmarks/refactor/seperate-fhir-from-data-types (tracing Element → Extension → ValueElement → Coding → Element)
**Learning**: When debugging circular import errors in Vite, the cycle often isn't between the two files you'd expect. The error `Element is not a function` in `Coding.ts` was caused by a 4-hop chain: Element.ts → Extension.ts → ValueElement.ts → Coding.ts → Element.ts. Read Vite's stack trace bottom-to-top to trace the actual module loading chain. The fix is to break the cycle at the root (Element should not import Extension), not at intermediate links.
**Suggested destination**: Strategies

### Arrow-function statics required for applySchemaMixinTo

**Discovered during**: ruthmarks/refactor/seperate-fhir-from-data-types (DatatypeChoice Mixin + Extension)
**Learning**: `applySchemaMixinTo` uses `Object.assign(base, mixin)` to copy statics from the mixin class onto the base class. `Object.assign` only copies **enumerable own** properties. Regular static methods (`static foo() {}`) are **non-enumerable** — they live on the class's prototype descriptor and are invisible to `Object.assign`. Arrow-function static fields (`static foo = () => {}`) are **enumerable own** properties and get copied correctly. If a mixin class needs its statics to survive `applySchemaMixinTo`, use arrow-function fields for all statics.
**Suggested destination**: domain/clinical-domain/docs/FHIR Modeling Reference.md

### Schema.Class .Type and .Encoded are phantom types

**Discovered during**: ruthmarks/refactor/seperate-fhir-from-data-types (fixing Element test failure)
**Learning**: `.Type` and `.Encoded` on Effect Schema.Class are **phantom types** — they exist in TypeScript's type system but have no runtime value (`undefined` at runtime). Tests must use type-level assertions: `expectTypeOf<(typeof MyClass)['Type']['field']>()` — NOT `expectTypeOf(MyClass.Type.field)` which crashes with `Cannot read properties of undefined`. The `typeof X.Y.Z` syntax in a type position is purely compile-time and works fine.
**Suggested destination**: docs/Testing/Testing Reference.md

### Arbitrary annotation prevents recursive Extension explosion

**Discovered during**: ruthmarks/refactor/seperate-fhir-from-data-types (Extension arbitrary generation)
**Learning**: `Arbitrary.make()` on schemas with recursive Extension fields (via `Schema.suspend`) generates deeply nested structures with ~50 optional fields each, causing timeouts. Fix: annotate the `extension` array field with `{ arbitrary: () => (fc) => fc.constant([]) }`. This makes every Element-based schema generate empty extension arrays in property tests, reducing generation from ~4.3s to <50ms. The annotation is on the field definition in `Element()`, so all subclasses benefit automatically.
**Suggested destination**: docs/Testing/Testing Reference.md

### Base type factory pattern: return Schema.Class with statics, not { fields, Mixin }

**Discovered during**: ruthmarks/refactor/seperate-fhir-from-data-types (Element/BackboneElement/Resource refactor)
**Learning**: The preferred pattern for FHIR base type factories (Element, BackboneElement, Resource) is to return a `Schema.Class` subclass directly — `return class Foo extends Schema.Class<Foo>('Foo')(fields) { static Key = domainType }` — rather than returning a `{ fields, Mixin }` object. This means the returned class IS a schema (usable with `Schema.decodeSync`, `Arbitrary.make`, etc.) AND carries statics. Consumers spread `.fields` into their own Schema.Class definitions, then apply the factory's class as a mixin via `applySchemaMixinTo`. The `MixinableFields` utility is no longer used — `applySchemaMixinTo` is the sole mixin mechanism.
**Suggested destination**: domain/clinical-domain/docs/FHIR Modeling Reference.md

### Extension delegates DatatypeChoice methods manually, not via applySchemaMixinTo

**Discovered during**: ruthmarks/refactor/seperate-fhir-from-data-types (Extension refactor)
**Learning**: Extension is a special case — it's defined in the same file as Element to break circular imports, and it needs both Element fields and DatatypeChoice value[x] fields. Rather than chaining `applySchemaMixinTo` twice, Extension is a plain `Schema.Class` that manually delegates DatatypeChoice instance methods (`isExactlyOnePresent`, `isNonePresent`) by calling `ValueMixin.prototype.method.call(this)`, and wraps the static `allOptionKeys()`. This avoids complex mixin composition and keeps the Extension definition readable.
**Suggested destination**: domain/clinical-domain/docs/FHIR Modeling Reference.md

### Schema.extend cannot combine FinalTransformation with TypeLiteralTransformation

**Discovered during**: ruthmarks/refactor/seperate-fhir-from-data-types (debugging runtime Schema.extend failures)
**Learning**: Effect's `Schema.extend` handles many AST combinations but specifically CANNOT combine a `FinalTransformation` (created by `Schema.transformOrFail`) with a `TypeLiteralTransformation` (created by `Schema.fromKey` inside a struct). It falls through to "Unsupported schema or overlapping types". `Schema.extend(FinalTransformation, plainStruct)` WORKS fine — the issue is only when the struct side also contains property signature transforms like `fromKey`. In fhir-r4, this affects Extension.ts, Attachment.ts, and Questionnaire.ts (all use `fromKey('url')` in their field structs combined with `ElementIdentification`/`ResourceIdentification` which are `transformOrFail`). The ~40 other consumers with plain structs work fine. See `node_modules/effect/src/Schema.ts` lines 3524-3657. Full analysis in TODO.md.
**Suggested destination**: domain/clinical-domain/docs/FHIR Modeling Reference.md

### Effect Schema.Class instances cannot be reconstructed via Object.create + Object.assign

**Discovered during**: ruthmarks/refactor/seperate-fhir-from-data-types (deepAssignBaseUrls for FHIR arbitrary URL coordination)
**Learning**: Effect's `Schema.Class` (and by extension `MergeClasses`) instances carry internal state set up by the constructor — `_tag`, hash codes, and structural equality metadata from `Data.Class`. Reconstructing instances via `Object.create(Object.getPrototypeOf(v)) + Object.assign(result, fields)` produces objects that pass `instanceof` checks but fail during `Schema.encode` with errors like `Cannot read properties of undefined (reading '_tag')` or `Receiver must be an instance of class URL`. Using `ctor.make(rebuiltFields)` is closer but also fails because `make` expects the constructor input shape, not an arbitrary bag of walked properties. When you need to produce a modified copy of a Schema.Class instance for testing, consider mutating in-place (if not frozen), or doing a Schema encode→modify→decode round-trip through the plain encoded representation.
**Suggested destination**: docs/Testing/Testing Reference.md

### Native URL objects must be skipped in recursive object walkers

**Discovered during**: ruthmarks/refactor/seperate-fhir-from-data-types (deepAssignBaseUrls)
**Learning**: When recursively walking Effect Schema-generated values, native `URL` instances (used by `Schema.URLFromSelf`) look like plain objects to `typeof v === 'object'` checks. If walked and reconstructed, they lose their `URL` prototype and fail with `Receiver must be an instance of class URL` during encoding. Add `if (v instanceof URL) return v` alongside guards for `Date`, `ReadonlyUrl`, and other built-in types. General rule: any recursive object walker over schema-generated values needs explicit guards for all non-POJO built-in types that might appear in the tree.
**Suggested destination**: docs/Testing/Testing Reference.md

### applySchemaMixinTo has been eliminated — entries above are outdated

**Discovered during**: ruthmarks/refactor/seperate-fhir-from-data-types (applySchemaMixinTo elimination)
**Learning**: `applySchemaMixinTo` has been fully replaced by `MergeClasses` across the codebase. The following earlier entries are now outdated: "Arrow-function statics required for applySchemaMixinTo" (line 55), "Base type factory pattern" (line 73, reference to applySchemaMixinTo), "Extension delegates DatatypeChoice methods manually, not via applySchemaMixinTo" (line 79). The new pattern is `class Foo extends MergeClasses<Foo>('Foo')(mixin, fields) {}` — no intermediate class, no manual `.fields` spread, no aliased export. `MergeClasses` uses `for...in` (not `Object.assign`) to copy statics, which ensures inherited statics survive when a MergeClasses result is used as mixin input to another MergeClasses call.
**Suggested destination**: domain/clinical-domain/docs/FHIR Modeling Reference.md
