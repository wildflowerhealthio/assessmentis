# AGENTS.md — Assessment.is

Read [AGENTS Explanation](./docs/Agents/Explanation.md) for what this file is and how to maintain it.

## Critical Rules

- **Node.js 24.x required** (npm 10.9.2+)
- **Domain packages must be pure** — no side effects, no HTTP, no DB, no file I/O
- **Changes MUST include corresponding test updates**

### Agents MUST read relevant docs before certain tasks

- [Testing](./docs/Testing/Testing%20Reference.md)
  - [Unit Testing](./docs/Testing/Unit%20Testing%20How-To.md)
  - [Property Testing](./docs/Testing/Property%20Testing%20Reference.md)
- [Doc Comments](./docs/Documentation/Doc%20Comments%20Reference.md)

### Agents SHOULD Clarify before building or planning

Before starting any task, pause and think about the request, then ask clarifying questions to minimize guessing and confirm shared understanding. The last question should be: "Do you think I understand well enough to start?" If the user says to ask more, do another think-and-ask cycle. Err on the side of asking too many questions.

### Claude SHOULD use AskUserQuestion

Split large batches of questions over multiple asks

### Agents MUST ask for guidance before expanding scope

While completing tasks may be inclined to

- Stash code to check if an error is new
- Create new branches or commits
- Search online for information
- Writing code to verify the behaviour of other modules

You MUST consult with the user before doing these or similar actions.
They may have an answer or they may not want you to engage in that behaviour.

### Agents SHOULD NOT silently resolve judgment calls or spiral into obscure problem

The user brings domain knowledge, intent, and taste. They also often have a months long context window, and may recall things only past agents knew.
Don't silently resolve judgment calls or spiral into obscure problems — surface them so the human can contribute what they're best at.

### Agents SHOULD NOT guess at user intent or code state

If you've taken 3+ investigative actions on a sub-problem without converging, or you're about to work around something that smells like an accidental inconsistency, **stop and present the issue to the user**. Also surface: ambiguous naming, conflicting patterns across files, anything where you're choosing between two plausible interpretations. The trigger is: _"Am I guessing?"_ — if yes, ask.

### Agents SHOULD NOT use `any`, `@ts-ignore`, `@ts-expect-error`, unsafe casts

Code should be type-safe by design, not by assertion. If you encounter a situation where a cast seems unavoidable, surface it to the user in the response message (or PR description) with an explanation of why, so they can decide whether the design needs rethinking.

There do exist some, narrow exceptions to the rule:

- Type parameters within type parameters with complex structures
- When used in test files in such a way that it doesn't materially reduce confidence in the test
- Deeply technical, foundation code, that can't reasonably typecheck that is meaningfully tested in other ways

## Branch Naming

`username/type-description` (e.g., `ruthmarks/feat-add-dailyco-s3-setup`)

## Documentation

All docs follow the [four-kinds convention](./docs/Documentation/Explanation.md). After making changes, update nearby docs that describe changed behavior. See [Documentation How-To](./docs/Documentation/How-To.md).

## Agent Knowledge

- Read [Agent Strategies](./docs/Agents/Strategies.md) at session start — curated lessons on context management, handoff docs, and large refactors
- Scan [Learnings Inbox](./docs/Agents/Learnings%20Inbox.md) for recent relevant entries
- When you discover something non-obvious, append it to the Learnings Inbox
- SHOULD NOT edit Strategies.md directly — learnings go through the inbox

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
- [domain/clinical-domain/docs/FHIR Modeling Reference.md](domain/clinical-domain/docs/FHIR%20Modeling%20Reference.md) — FHIR R4 modeling conventions
- [apps/frontend/app/routes/React Router Data APIs Reference.md](apps/frontend/app/routes/React%20Router%20Data%20APIs%20Reference.md) — Route module data APIs
- [apps/frontend/e2e/E2E Testing Reference.md](apps/frontend/e2e/E2E%20Testing%20Reference.md) — Playwright test layout

## Commands

```bash
npm run dev          # Start all dev servers
npm run build        # Build monorepo
npm run typecheck    # Type check all packages
npm run test         # Run all tests
npm run lint:fix     # Auto-fix lint issues
npm run format       # Oxfmt
```
