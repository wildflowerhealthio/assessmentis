# AGENTS.md — apps/

Apps compose domain and infrastructure layers. They handle routing, user interaction, and service integration.

## Rules

- No business logic (belongs in domain/)
- No domain model definitions (use domain packages)
- No bypassing domain repositories
- Always go through domain interfaces

## References

- [Cloud Functions How-To](./Cloud%20Functions%20How-To.md) — Adding and deploying Firebase functions
- [apps/frontend/AGENTS.md](./frontend/AGENTS.md) — Frontend-specific guidance
- [Architecture Reference](../docs/Architecture/Reference.md) — Package dependency rules
