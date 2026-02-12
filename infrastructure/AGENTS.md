# AGENTS.md — infrastructure/

Concrete implementations of domain interfaces. Talks to external services.

## Rules

- **No business logic** (belongs in domain/)
- **Map all external errors to domain error types** at boundaries
- **Use Effect Layers** to provide domain Tag implementations
- **No UI components**

## References

- [Layer Implementation How-To](./Layer%20Implementation%20How-To.md) — Creating layers, error mapping, server-side infrastructure
- [Effect Patterns Reference](../docs/Effect/Patterns%20Reference.md) — Repository pattern, Layer composition
- [Architecture Explanation](../docs/Architecture/Explanation.md) — Why the domain/infrastructure split exists
