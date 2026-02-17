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
