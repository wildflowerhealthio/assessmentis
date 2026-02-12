# AGENTS.md — domain/

Pure business logic. No side effects, no framework dependencies.

## Rules

- **NO side effects**: no HTTP calls, no DB queries, no file I/O, no console.log
- **Use Effect-TS** for all business logic
- **Use Effect Schema** for all data validation (add round-trip property tests)
- **Define interfaces here, implement in infrastructure/**

## References

- [Platform Domain Explanation](./platform-domain/Platform%20Domain%20Explanation.md) — Auth, authorization, org context, DocumentStore
- [Effect Patterns Reference](../docs/Effect/Patterns%20Reference.md) — Repository pattern, error wrappers, generators
- [docs/Testing/](../docs/Testing/Testing%20Reference.md) — Property-based testing patterns
