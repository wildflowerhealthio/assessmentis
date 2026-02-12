# AGENTS.md — Assessment.is

Read [AGENTS Explanation](./docs/Agents/Explanation.md) for what this file is and how to maintain it.

## Critical Rules

- **Node.js 22.x required** (npm 10.9.2+)
- **Domain packages must be pure** — no side effects, no HTTP, no DB, no file I/O
- **Changes MUST include corresponding test updates**
- **This project is picky about testing** — Read [docs/Testing/](./docs/Testing/Testing%20Reference.md)

## Branch Naming

`username/type-description` (e.g., `ruthmarks/feat-add-dailyco-s3-setup`)

## Documentation

All docs follow the [four-kinds convention](./docs/Documentation/Explanation.md). After making changes, update nearby docs that describe changed behavior. See [Documentation How-To](./docs/Documentation/How-To.md).

## Key References

- [Architecture Explanation](./docs/Architecture/Explanation.md) — Platform services, layered architecture, DocumentStore
- [Architecture Reference](./docs/Architecture/Reference.md) — Package inventory, dependency rules, tech stack
- [Effect Patterns Reference](./docs/Effect/Patterns%20Reference.md) — Repository pattern, generators, error wrappers, Layers
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Dev setup, code style, formatting, git workflow
- [docs/Testing/](./docs/Testing/Testing%20Reference.md) — Property testing, unit testing, React testing, integration testing
- [Documentation Reference](./docs/Documentation/Reference.md) — Naming rules for docs

## Commands

```bash
npm run dev          # Start all dev servers
npm run build        # Build monorepo
npm run typecheck    # Type check all packages
npm run test         # Run all tests
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier
```
