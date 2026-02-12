# AGENTS.md — Assessment.is

Read [AGENTS Explanation](./docs/Agents/Explanation.md) for what this file is and how to maintain it.

## Critical Rules

- **Node.js 22.x required** (npm 10.9.2+)
- **Domain packages must be pure** — no side effects, no HTTP, no DB, no file I/O
- **Changes MUST include corresponding test updates**
- **This project is picky about testing** — Read [docs/Testing/](./docs/Testing/Testing%20Reference.md)
- **Clarify before building** — Before starting any task, pause and think about the request, then ask ~5 clarifying questions to minimize guessing and confirm shared understanding. Finish with: "Do you think I understand well enough, or should I ask more questions?" If the user says to ask more, do another think-and-ask cycle. Err on the side of asking too many questions.

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

## Agent Index

- [apps/frontend/app/layers/Platform Services Reference.md](apps/frontend/app/layers/Platform%20Services%20Reference.md) — Frontend platform services wiring
- [global/ontology/Error Mapping Reference.md](global/ontology/Error%20Mapping%20Reference.md) — Cross-layer error taxonomy and mapping
- [domain/clinical-domain/FHIR Modeling Reference.md](domain/clinical-domain/FHIR%20Modeling%20Reference.md) — FHIR R4 modeling conventions
- [apps/frontend/app/routes/React Router Data APIs Reference.md](apps/frontend/app/routes/React%20Router%20Data%20APIs%20Reference.md) — Route module data APIs
- [apps/frontend/e2e/E2E Testing Reference.md](apps/frontend/e2e/E2E%20Testing%20Reference.md) — Playwright test layout

## Commands

```bash
npm run dev          # Start all dev servers
npm run build        # Build monorepo
npm run typecheck    # Type check all packages
npm run test         # Run all tests
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier
```
